import React from "react";
import { getPOSInitData } from "@/actions/pos";
import { POSClient } from "@/components/pos/pos-client";

export const revalidate = 0;

export default async function POSPage() {
  const initialData = await getPOSInitData();

  return <POSClient initialData={initialData} />;
}
