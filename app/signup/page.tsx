"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { LANGUAGE } from "@/lib/language";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Couldn't create your account, try again");
      }
    } catch (e) {
      setError("Something went wrong, try again");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#F2F5F2",
          padding: "32px",
          borderRadius: "16px",
          width: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <img
          src="/bulka.png"
          alt=""
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            objectFit: "cover",
            alignSelf: "center",
            marginBottom: "4px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#26332B", fontWeight: 700, fontSize: "18px" }}>
          <Lock size={16} /> {LANGUAGE.appTitle}
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoFocus
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1.5px solid #E2E7E2",
            background: "#FFFFFF",
            color: "#26332B",
            outline: "none",
            fontSize: "15px",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1.5px solid #E2E7E2",
            background: "#FFFFFF",
            color: "#26332B",
            outline: "none",
            fontSize: "15px",
          }}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1.5px solid #E2E7E2",
            background: "#FFFFFF",
            color: "#26332B",
            outline: "none",
            fontSize: "15px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "#2E9C6B",
            color: "#FFFFFF",
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : "Sign up"}
        </button>
        {error && <div style={{ color: "#CC4F5C", fontSize: "13px", fontWeight: 600 }}>{error}</div>}
        <div style={{ textAlign: "center", fontSize: "13px", color: "#869089" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#2E9C6B", fontWeight: 600 }}>
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
