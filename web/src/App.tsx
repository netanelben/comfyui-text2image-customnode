import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import workflow from "./workflows/workflow_api.json";
import "./App.css";

const clientUniqueId = uuidv4();

function App() {
  const [text, settext] = useState("");
  const [imageSrc, setimageSrc] = useState<string | null>(null);

  useEffect(() => {
    console.log("🧩 Loading workflow", workflow);

    const hostname = window.location.hostname + ":" + window.location.port;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsClient = new WebSocket(
      `${protocol}//${hostname}/ws?clientId=${clientUniqueId}`
    );

    wsClient.onopen = () => {
      console.log("🛜 Connected to the server");
    };

    wsClient.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      console.log("📡 Message from server", data);

      if (data.type === "executed") {
        if ("images" in data.data.output) {
          const image = data.data.output.images[0];
          const filename = image.filename;
          const subfolder = image.subfolder;
          const rando = Math.floor(Math.random() * 1000);
          const imageSrc = `/view?filename=${filename}&type=output&subfolder=${subfolder}&rand=${rando}`;

          setimageSrc(imageSrc);
        }
      }
    });
  }, []);

  const handleTextChange = (e: any) => {
    const text = e.target.value;
    settext(text);
  };

  const handleGenerate = async (e: any) => {
    if (!text) return;

    const results = await queuePrompt(text, clientUniqueId);
    console.log({ results });
    // setimageSrc();
  };

  async function queuePrompt(prompt: string, clientId: string) {
    const data = { prompt, client_id: clientId };

    const response = await fetch("/prompt", {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async function interruptPrompt() {
    const response = await fetch("/interrupt", {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "text/html",
      },
    });

    console.log("❌ Interrupting prompt", response);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="logo"
          style={{
            width: "600px",
            height: "600px",
            objectFit: "contain",
          }}
        />
      ) : (
        <div
          style={{
            width: "600px",
            height: "600px",
            backgroundColor: "lightgray",
          }}
        />
      )}
      <textarea
        type="text"
        placeholder="Prompt"
        onChange={handleTextChange}
        style={{
          height: 80,
          padding: 10,
        }}
      />
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
        <button onClick={handleGenerate} style={{ flex: 1 }}>
          Generate
        </button>
        <button onClick={interruptPrompt}>❌</button>
      </div>
    </div>
  );
}

export default App;
