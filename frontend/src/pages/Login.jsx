import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import API from "../services/api";
import AuthLayout from "../components/AuthLayout";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [showPassword, setShowPassword] = useState(false);
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email().required("Email required"),
      password: Yup.string().required("Password required"),
    }),
    onSubmit: async (values) => {
      try {
        const res = await API.post("/auth/login", values);
        dispatch(loginSuccess(res.data));
        //navigate("/dashboard");
        const loggedUser = res.data.user;
        if (loggedUser.role === "admin") navigate("/dashboard");
        else if (loggedUser.role === "teacher") navigate("/dashboard");
        else if (loggedUser.role === "student") navigate("/dashboard");
        else if (loggedUser.role === "parent") navigate("/dashboard");
      } catch {
        alert("Invalid credentials");
      }
    },
  });

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <input
          placeholder="Email"
          className="w-full p-3 border rounded-lg"
          {...formik.getFieldProps("email")}
        />
        <p className="text-red-500 text-sm">{formik.errors.email}</p>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-3 border rounded-lg pr-10"
            {...formik.getFieldProps("password")}
          />

          {/* 👁️ Eye Icon */}
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-indigo-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <p className="text-red-500 text-sm">{formik.errors.password}</p>
        <p
          className="text-blue-500 cursor-pointer mt-2"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </p>
        <button className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700">
          Login
        </button>
      </form>
    </AuthLayout>
  );
}
