// only for checking

import { Connection, WorkflowClient } from "@temporalio/client";
import { compareHotelRates } from "./workflows";

async function runWorkflow(city: string) {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new WorkflowClient({ connection });

  const result = await client.execute(compareHotelRates, {
    args: [city],
    taskQueue: "hotel-comparison",
    workflowId: `hotel-compare-${city}-${Date.now()}`,
  });

  console.log(result);
}

runWorkflow("delhi").catch((err) => console.error(err));
