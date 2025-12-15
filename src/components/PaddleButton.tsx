// src/components/PaddleButton.tsx
import { useEffect, useState } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

const SANDBOX = true;

interface Props {
  priceId: string;
  userId: string;
  userEmail: string;
}

export default function PaddleButton({ priceId, userId, userEmail }: Props) {
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    initializePaddle({
      environment: SANDBOX ? 'sandbox' : 'production',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string,
    }).then(setPaddle);
  }, []);

  const open = () => {
    if (!paddle) return;
    paddle.Checkout.open({
      settings: { displayMode: 'overlay', theme: 'dark' },
      items: [{ priceId, quantity: 1 }],
      customData: { userId },
      customer: { email: userEmail },
    });
  };

  return (
    <button
      onClick={open}
      disabled={!paddle}
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-60"
    >
      Upgrade
    </button>
  );
}
