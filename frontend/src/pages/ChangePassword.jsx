import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

export default function ChangePassword() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const handleSubmit = async () => {
    try {
      await API.post("/auth/change-password", form);
      toast.success("Password updated");
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  return (
    <div className="p-4">
      <h2>Change Password</h2>

      <input
        type="password"
        placeholder="Old Password"
        onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
      />

      <input
        type="password"
        placeholder="New Password"
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
      />

      <button onClick={handleSubmit}>Update</button>
    </div>
  );
}
