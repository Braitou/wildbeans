import OrderStatus from './OrderStatus';

export const dynamic = 'force-dynamic';

export default function OrderPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="min-h-[70vh] py-8">
      <h1 className="mb-2 text-center text-sm font-semibold tracking-[0.22em] uppercase">
        Your Order
      </h1>
      <OrderStatus orderId={id} />
    </main>
  );
}
