import OrderStatus from './OrderStatus';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-[70vh] py-8">
      <h1 className="mb-2 text-center text-sm font-semibold tracking-[0.22em] uppercase">
        Your Order
      </h1>
      <OrderStatus orderId={id} />
    </main>
  );
}
