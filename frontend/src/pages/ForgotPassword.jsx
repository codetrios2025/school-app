import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email) return toast.error("Email is required");

    try {
      setLoading(true);

      await API.post("/auth/forgot-password", { email });

      toast.success("Reset link sent to your email 📩");

      setEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email and we’ll send you a reset link
        </p>

        {/* Input */}
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {/* Back to login */}
        <p
          className="text-sm text-center text-indigo-600 mt-4 cursor-pointer hover:underline"
          onClick={() => navigate("/")}
        >
          Back to Login
        </p>
      </div>
    </AuthLayout>
  );
}
