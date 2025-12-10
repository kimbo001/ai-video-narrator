import { z } from 'zod';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { script } = req.body;
  const schema = z.object({ script: z.string().max(10000) });
  if (!schema.safeParse({ script }).success) return res.status(413).json({ error: 'Payload too large' });

  // 1.  beat & pause map
  const prompt = `You are a film-director AI.
Split the script into emotional beats (≤3 s) and insert natural pauses.
Return ONLY JSON:
{
  "emotion":[{"start":0.0,"end":2.8,"valence":0.75,"energy":0.6,"label":"excited"}],
  "pauses":[{"pos":2.8,"duration":0.45,"type":"breath"}]
}
Script:
${script}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
  const beatMap = JSON.parse((await geminiRes.json()).candidates[0].content.parts[0].text);

  // 2.  TTS chunks
  const chunks = []; let cursor = 0;
  beatMap.pauses.forEach(p => { chunks.push({text:script.slice(cursor, p.pos), pause:p.duration}); cursor = p.pos; });
  chunks.push({text:script.slice(cursor), pause:0});

  const audioBuffers = await Promise.all(chunks.map(async ch => {
    const ttsRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:ch.text}]}], generationConfig:{audioTimestamp:true, temperature:0.3}})});
    const mp3b64 = (await ttsRes.json()).candidates[0].content.parts.find(p=>p.inlineData)?.inlineData.data;
    return { mp3b64, pause:ch.pause };
  }));

  // 3.  glue
  const { AudioContext } = await import('node-web-audio-api');
  const ctx = new AudioContext({sampleRate:24000});
  const bufs = await Promise.all(audioBuffers.map(async b => {
    const ab = await (await fetch(`data:audio/mp3;base64,${b.mp3b64}`)).arrayBuffer();
    return { buf:await ctx.decodeAudioData(ab), pause:b.pause };
  }));
  let offset = 0;
  const totalFrames = bufs.reduce((a,b) => a + b.buf.length + b.pause*24000, 0);
  const mix = ctx.createBuffer(2, totalFrames, 24000);
  bufs.forEach(b => {
    for (let ch=0;ch<2;ch++) mix.getChannelData(ch).set(b.buf.getChannelData(ch), offset);
    offset += b.buf.length + b.pause*24000;
  });

  // 4.  mp3
  const wav = mix.getChannelData(0);
  const { Mp3Encoder } = await import('lamejs');
  const enc = new Mp3Encoder(2, 24000, 128);
  const mp3 = enc.encodeBuffer(wav);
  const blob = new Blob([mp3], {type:'audio/mp3'});

  // 5.  edl
  const { create } = await import('xmlbuilder2');
  const edl = create({version:'1.0'}).ele('xmeml',{version:'5'})
    .ele('sequence',{name:'AI Video Narrator'});
  beatMap.emotion.forEach(b=>
    edl.ele('marker',{name:b.label,start:b.start,end:b.end,color:'Red'}));
  const xmlStr = edl.end({prettyPrint:true});

  // 6.  send
  res.setHeader('Content-Type', 'application/json');
  res.json({
    beatMap,
    audioUrl: `data:audio/mp3;base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`,
    edl: xmlStr
  });
}
