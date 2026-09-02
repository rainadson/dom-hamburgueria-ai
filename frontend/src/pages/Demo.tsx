import { useState } from "react";
import { api } from "../services/api";
import "../styles/demo.css";

interface Message {
  id: number;
  sender: "customer" | "bot";
  text: string;
  image?: { url: string; alt: string };
}

export default function Demo() {

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Olá! 👋 Bem-vindo à Dom Hamburgueria!\n\nComo posso ajudar?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Número usado apenas para identificar a conversa da demonstração
  const demoPhone = "demo-reuniao";

  async function sendMessage() {

    const message = input.trim();

    if (!message || loading) return;

    const customerMessage: Message = {
      id: Date.now(),
      sender: "customer",
      text: message,
    };

    setMessages((current) => [
      ...current,
      customerMessage,
    ]);

    setInput("");
    setLoading(true);

    try {

      const { data } = await api.post("/chat", {
        phone: demoPhone,
        message,
      });

      const reply = data?.ai?.reply;

      if (reply) {

        const botMessage: Message = {
          id: Date.now() + 1,
          sender: "bot",
          text: reply,
          image: data?.ai?.image,
        };

        setMessages((current) => [
          ...current,
          botMessage,
        ]);

      }

    } catch (error) {

      console.error("Erro ao enviar mensagem:", error);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);

    } finally {

      setLoading(false);

    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {

    if (event.key === "Enter") {
      sendMessage();
    }

  }

  return (

    <div className="demo-page">

      <div className="demo-phone">

        <header className="demo-header">

          <div className="demo-avatar">
            🍔
          </div>

          <div>
            <h2>Dom Hamburgueria</h2>
            <span>
              {loading ? "digitando..." : "online"}
            </span>
          </div>

        </header>

        <main className="demo-messages">

          {messages.map((message) => (

            <div
              key={message.id}
              className={`demo-message ${
                message.sender === "customer"
                  ? "customer-message"
                  : "bot-message"
              }`}
            >
              {message.image && (
                <a href={message.image.url} target="_blank" rel="noreferrer">
                  <img src={message.image.url} alt={message.image.alt} className="demo-menu-image" />
                </a>
              )}
              {message.text.split("\n").map((line, index) => (
                <span key={index}>
                  {line}

                  {index <
                    message.text.split("\n").length - 1 && (
                    <br />
                  )}
                </span>
              ))}
            </div>

          ))}

          {loading && (
            <div className="demo-message bot-message typing">
              Digitando...
            </div>
          )}

        </main>

        <footer className="demo-input-area">

          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            ➤
          </button>

        </footer>

      </div>

    </div>

  );
}