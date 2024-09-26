import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import workflow from "./workflows/workflow_api.json";
import "./App.css";
import { MessageData } from "./types";

const clientUniqueId = uuidv4();

function App() {
  const [text, settext] = useState("");
  const [imageSrc, setimageSrc] = useState<string | null>(null);
  const [progress, setprogress] = useState({ value: 0, max: 0 });

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
      const data = JSON.parse(event.data) as MessageData;
      console.log("📡 Message from server", data);

      if (data.type === "progress") {
        trackProgress(data.data.value, data.data.max);
      }

      if (data.type === "executed") {
        if ("images" in data.data.output) {
          const image = data.data.output.images[0];
          const { filename, type, subfolder } = image;
          const rando = Math.floor(Math.random() * 1000);
          const imageSrc = `/view?filename=${filename}&type=${type}&subfolder=${subfolder}&rand=${rando}`;

          setimageSrc(imageSrc);
        }
      }
    });
  }, []);

  const trackProgress = (value: number, max: number) => {
    console.log(`🚦 Generate progress ${value}/${max}`);
    setprogress({ value, max });
  };

  const handleTextChange = (e: any) => {
    const text = e.target.value;
    settext(text);
  };

  const handleGenerate = async (e: any) => {
    if (!text) return;
    if (typeof workflow === "undefined") return;

    // Find the key of prompt node
    const inputNodeNumber = Object.entries(workflow).find(
      ([key, value]) => value.class_type === "CLIPTextEncode"
    )[0] as keyof typeof workflow;

    // Find the key of KSampler node
    const samplerNodeNumber = Object.entries(workflow).find(
      ([key, value]) => value.class_type === "KSampler"
    )[0] as keyof typeof workflow;

    workflow[inputNodeNumber].inputs.text = text.replaceAll(
      /\r\n|\n|\r/gm,
      " "
    );

    workflow[samplerNodeNumber].inputs.seed = Math.floor(
      Math.random() * 9999999999
    );

    const results = await queuePrompt(workflow);
    console.log({ results });
    // setimageSrc();
  };

  async function queuePrompt(workflow = {}) {
    const data = { prompt: workflow, client_id: clientUniqueId };

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
          {progress.value > 0 && ` (${progress.value}/${progress.max})`}
        </button>
        <button onClick={interruptPrompt}>❌</button>
      </div>
    </div>
  );
}

export default App;
