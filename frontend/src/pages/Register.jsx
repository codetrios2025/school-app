import { useFormik } from "formik";
import * as Yup from "yup";
import API from "../services/api";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const formik = useFormik({
    initialValues: { name: "", email: "", password: "", role: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Name required"),
      email: Yup.string().email().required("Email required"),
      password: Yup.string().min(6).required("Password required"),
      role: Yup.string().required("Select role"),
    }),
    onSubmit: async (values) => {
      try {
        await API.post("/auth/register", values);
        alert("Registered Successfully");
      } catch (err) {
        alert(err.response?.data?.message);
      }
    },
  });

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <input
          placeholder="Full Name"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...formik.getFieldProps("name")}
        />
        <p className="text-red-500 text-sm">{formik.errors.name}</p>

        <input
          placeholder="Email"
          className="w-full p-3 border rounded-lg"
          {...formik.getFieldProps("email")}
        />
        <p className="text-red-500 text-sm">{formik.errors.email}</p>

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg"
          {...formik.getFieldProps("password")}
        />
        <p className="text-red-500 text-sm">{formik.errors.password}</p>

        <select
          className="w-full p-3 border rounded-lg"
          {...formik.getFieldProps("role")}
        >
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
        </select>
        <p className="text-red-500 text-sm">{formik.errors.role}</p>

        <button className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700">
          Register
        </button>
      </form>
    </AuthLayout>
  );
}
