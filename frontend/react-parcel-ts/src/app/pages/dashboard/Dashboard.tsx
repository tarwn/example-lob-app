import React from 'react';
import { AttachMoney as Dollar, ShoppingCart, Person, Comment } from "@material-ui/icons";
import { CardWithIcon } from '~app/components/CardWithIcon';
import { DailyRevenue, OrderSummary, ReviewSummary, } from "../../types";
import { useFetch } from "../../utilities/useFetch";
import { OrderSummaryList } from './_components/OrderSummaryList';

export const DashboardPage: React.FunctionComponent = () => {
  const [revenueAmount, setRevenueAmount] = React.useState<number | undefined>(undefined);
  const [pendingOrderCount, setPendingOrderCount] = React.useState<number | undefined>(undefined);

  const revenue = useFetch<DailyRevenue[]>("/api/fe/revenue", (data: any) => {
    const rows = data.map((r: any) => ({
      date: new Date(r.date),
      amount: r.amount
    })) as DailyRevenue[];
    const revTotal = rows.reduce((ttl, r) => ttl + r.amount, 0);
    setRevenueAmount(revTotal);
    return rows;
  });

  const pendingOrders = useFetch<OrderSummary[]>("/api/fe/orders/pending", (data: any) => {
    const orders = data.map((o: any) => ({
      id: o.id,
      orderDate: new Date(o.orderDate),
      status: o.status,
      customer: {
        id: o.customer.id,
        name: o.customer.name,
        avatar: o.customer.avatar ?? undefined
      },
      itemCount: o.itemCount,
      orderTotal: o.orderTotal
    })) as OrderSummary[];
    setPendingOrderCount(orders.length);
    return orders;
  });

  const pendingReviews = useFetch<ReviewSummary[]>("/api/fe/reviews/pending", (data: any) => {
    return data.map((r: any) => ({
      id: r.id,
      reviewDate: new Date(r.reviewDate),
      review: r.review,
      status: r.status,
      customer: {
        id: r.customer.id,
        name: r.customer.name,
        avatar: r.customer.avatar ?? undefined
      }
    }));
  });

  const newCustomers = useFetch<OrderSummary[]>("/api/fe/orders/newCustomers", (data: any) => {
    return data.map((o: any) => ({
      id: o.id,
      orderDate: new Date(o.orderDate),
      orderStatus: o.orderStatus,
      customer: {
        id: o.customer.id,
        name: o.customer.name,
        avatar: o.customer.avatar ?? undefined
      },
      itemCount: o.itemCount,
      orderTotal: o.orderTotal
    })) as OrderSummary[];
  });

  const revenueSummary = revenueAmount == undefined
    ? "loading..."
    : revenueAmount.toLocaleString("en-US", { style: 'currency', currency: 'USD' });

  const orderCountSummary = pendingOrderCount == undefined
    ? "loading..."
    : pendingOrderCount.toLocaleString("en-US", { style: 'decimal', maximumFractionDigits: 0 });

  // note: this layout is designed to match the react-admin one, though the responsiveness is going to be less borked
  return (
    <div className="lob-dashboard">
      <div className="lob-dashboard-orders">
        <div className="lob-dashboard-orders-5050">
          <CardWithIcon icon={Dollar} title="Monthly Revenue" subtitle={revenueSummary} to={"/orders"} />
          <CardWithIcon icon={ShoppingCart} title="Pending Orders" subtitle={orderCountSummary} to={"/orders"} />
        </div>
        <div className="lob-section">
          chart
        </div>
        <div className="lob-section">
          <h2>Pending Orders</h2>
          <OrderSummaryList orders={pendingOrders} />
        </div>
      </div>
      <div className="lob-dashboard-other">
        <CardWithIcon icon={Comment} title="Pending Reviews" subtitle={"TBD"} to={"/reviews"} />
        <CardWithIcon icon={Person} title="New Customers" subtitle={"TBD"} to={"/customers"} />
      </div>
    </div>
  );
};
