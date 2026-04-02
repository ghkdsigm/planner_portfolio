const API_BASE_URL = (import.meta.env.VITE_CHAT_API_BASE_URL || "/api").replace(/\/$/, "");

export async function requestPortfolioChat({ question, history = [] }) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      history,
    }),
  });

  if (!response.ok) {
    const message = await safeReadError(response);
    throw new Error(message || "챗봇 응답을 불러오지 못했습니다.");
  }

  return response.json();
}

async function safeReadError(response) {
  try {
    const data = await response.json();
    return data?.message || data?.error || "";
  } catch {
    return "";
  }
}
