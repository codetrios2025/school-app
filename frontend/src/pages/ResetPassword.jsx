import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.password) return toast.error("Password required");
    if (form.password.length < 6)
      return toast.error("Minimum 6 characters required");
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match");

    try {
      setLoading(true);

      await API.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });

      toast.success("Password reset successful 🎉");

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your new password below
        </p>

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            className="w-full p-3 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-indigo-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="relative mb-4">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full p-3 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-indigo-600"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>

        {/* Back */}
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
