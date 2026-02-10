import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [workflows, setWorkflows] = useState([]);
    const [workflowData, setWorkflowData] = useState(null);
    const [owner, setOwner] = useState("");
    const [repo, setRepo] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState("");

    const [isAuth, setIsAuth] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    // const base_url =
    //     process.env.REACT_APP_BASE_BE_URL;
    // console.log("ENV", process.env.REACT_APP_BASE_BE_URL);

    // ADDED: Frontend auth check (Auth Guard)
    useEffect(() => {
        fetch(`/auth/github/status`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setIsAuth(data.authenticated);
                setAuthLoading(false);
            })
            .catch(() => {
                setIsAuth(false);
                setAuthLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // EXISTING: Load repo from localStorage
    useEffect(() => {
        const savedOwner = localStorage.getItem("Owner");
        const savedRepo = localStorage.getItem("Repo");

        if (savedOwner) setOwner(savedOwner);
        if (savedRepo) setRepo(savedRepo);
    }, []);

    // EXISTING: Auto fetch workflows
    useEffect(() => {
        if (owner && repo) {
            fetchWorkflows();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner, repo]);

    const handleLogout = async () => {
        try {
            await fetch(`/auth/github/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Logout failed");
        } finally {
            // Clear frontend state
            setIsAuth(false);
            setWorkflows([]);
            setWorkflowData(null);
            setOwner("");
            setRepo("");
            localStorage.clear();
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return "—";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    // FIXED: Better error + auth handling
    const fetchWorkflows = async () => {
        if (!owner || !repo) {
            setError("Please enter owner and repo");
            return;
        }

        setIsLoading(true);
        setError("");
        setWorkflowData(null);

        localStorage.setItem("Owner", owner);
        localStorage.setItem("Repo", repo);

        try {
            const res = await fetch(
                `/github/${owner}/${repo}/workflows`,
                { credentials: "include" },
            );

            // ADDED: Auth error handling
            if (res.status === 401) {
                setIsAuth(false);
                throw new Error("Unauthorized. Please login again.");
            }

            // ADDED: Repo not found handling
            if (res.status === 404) {
                throw new Error("Repository not found");
            }

            if (!res.ok) {
                throw new Error("Failed to fetch workflows");
            }

            const data = await res.json();
            setWorkflows(data.workflow_runs.slice(0, 10));
        } catch (err) {
            setError(err.message);
            setWorkflows([]);
        } finally {
            setIsLoading(false);
        }
    };

    // FIXED: Summary API error handling
    const handleViewSummary = async (id) => {
        setIsSummaryLoading(true);
        setError("");

        try {
            const res = await fetch(
                `/github/${owner}/${repo}/workflows/${id}/summary`,
                { credentials: "include" },
            );

            if (res.status === 401) {
                setIsAuth(false);
                throw new Error("Session expired. Please login again.");
            }

            if (res.status === 404) {
                throw new Error("Workflow not found");
            }

            if (!res.ok) throw new Error("Failed to fetch summary");

            const data = await res.json();
            setWorkflowData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleBack = () => setWorkflowData(null);

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "#28a745";
            case "in_progress":
                return "#007bff";
            case "failed":
                return "#dc3545";
            default:
                return "#6c757d";
        }
    };

    const maxDuration = Math.max(
        ...workflows.map((wf) => wf.run_duration || 0),
        1,
    );

    if (authLoading) {
        return <p>Checking authentication...</p>;
    }

    if (!isAuth) {
        return (
            <div style={{ textAlign: "center", marginTop: "4rem" }}>
                <h2>Login Required</h2>
                <p>Please login with GitHub to continue</p>
                {/* <a href={`${base_url}/auth/github/login`}> */}
                <a href={`/auth/github/login`}>
                    <button>Login with GitHub</button>
                </a>
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h1>GitHub Workflow Dashboard</h1>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* Repo input */}
            <div style={{ marginBottom: "1.5rem" }}>
                <input
                    placeholder="Owner (e.g. facebook)"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />
                <input
                    placeholder="Repo (e.g. react)"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />
                <button onClick={fetchWorkflows} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Load Workflows"}
                </button>
            </div>

            {/* FIXED: Proper error state */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Summary View */}
            {workflowData ? (
                <div style={{ padding: "1rem", border: "1px solid #ddd" }}>
                    {isSummaryLoading ? (
                        <p>Loading summary...</p>
                    ) : (
                        <>
                            <h2>Workflow Summary</h2>

                            <p>
                                <strong>ID:</strong>{" "}
                                {workflowData.workflowRunId}
                            </p>
                            <p>
                                <strong>Total Jobs:</strong>{" "}
                                {workflowData.totalJobs}
                            </p>
                            <p>
                                <strong>CO₂:</strong>{" "}
                                {workflowData.carbon
                                    ? workflowData.carbon.toFixed(3)
                                    : "N/A"}{" "}
                                grams
                            </p>
                            <p>
                                <strong>Duration:</strong>{" "}
                                {formatDuration(
                                    workflowData.totalDurationSeconds,
                                )}
                            </p>

                            <h3>Jobs</h3>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {workflowData.jobs?.map((job) => (
                                    <li
                                        key={job.jobId}
                                        style={{
                                            border: "1px solid #eee",
                                            padding: "0.75rem",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        <strong>{job.name}</strong>
                                        <p>Runner: {job.runner}</p>
                                        <p>
                                            Duration:{" "}
                                            {job.inProgress
                                                ? "Running..."
                                                : formatDuration(
                                                      job.durationSeconds,
                                                  )}
                                        </p>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={handleBack}>Back</button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* Loading */}
                    {isLoading && <p>Loading workflows...</p>}

                    {/* FIXED: Proper empty states */}
                    {!isLoading && !owner && !repo && (
                        <p>Enter a GitHub owner and repository to begin.</p>
                    )}

                    {!isLoading &&
                        owner &&
                        repo &&
                        workflows.length === 0 &&
                        !error && (
                            <p>No workflows found for this repository.</p>
                        )}

                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {workflows.map((wf) => (
                            <li
                                key={wf.id}
                                style={{
                                    border: "1px solid #ddd",
                                    padding: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <h3>{wf.name}</h3>
                                <p>
                                    {new Date(wf.created_at).toLocaleString()}
                                </p>

                                <div
                                    style={{
                                        background: "#eee",
                                        height: "6px",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "6px",
                                            width: `${(wf.run_duration / maxDuration) * 100}%`,
                                            background: getStatusColor(
                                                wf.status,
                                            ),
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => handleViewSummary(wf.id)}
                                >
                                    View Summary
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default App;

