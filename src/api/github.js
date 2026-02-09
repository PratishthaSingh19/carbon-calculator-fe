// import axios from "axios";
// import { WorkflowSummary, WorkflowRun } from "../types";

// const API_BASE = "http://localhost:3000"; // replace with your backend URL

// export const getWorkflows = async (): Promise<WorkflowRun[]> => {
//     const res = await axios.get(`${API_BASE}/workflows`, {
//         withCredentials: true,
//     });
//     return res.data?.workflow_runs || [];
// };

// export const getWorkflowSummary = async (
//     workflowId: string,
// ): Promise<WorkflowSummary> => {
//     const res = await axios.get(`${API_BASE}/workflows/${workflowId}/summary`, {
//         withCredentials: true,
//     });
//     return res.data;
// };
