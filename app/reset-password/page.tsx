"use client";

import { useEffect } from "react";

export default function ResetPasswordPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (tokenHash && type === "recovery") {
      window.location.href = `mathapp://reset-password?token_hash=${tokenHash}&type=recovery`;
    } else {
      window.location.href = "/";
    }
  }, []);

  return null;
}