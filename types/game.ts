export type TradeStatus = "pending" | "approved" | "rejected";

export type City = {
  id: string;
  name: string;
  group_code: string;
  defense_score: number;
  stability_score: number;
};

export type Trade = {
  id: string;
  from_city_id: string;
  to_city_id: string;
  offer_resource_type_id: string;
  offer_amount: number;
  request_resource_type_id: string | null;
  request_amount: number | null;
  status: TradeStatus;
  created_at: string;
};
