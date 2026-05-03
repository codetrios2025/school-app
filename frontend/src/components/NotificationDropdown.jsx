import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setNotifications,
  resetCount,
} from "../features/notification/notificationSlice";
import API from "../services/api";
import { FaCheck, FaTrash } from "react-icons/fa";

export default function NotificationDropdown() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notification.list);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      const data = res.data.data || [];

      dispatch(setNotifications(data));
      dispatch(resetCount());
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Mark single as read
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  // ❌ Delete notification
  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-96 bg-white shadow-xl rounded-xl p-4 z-50 border">
      <h3 className="font-semibold text-gray-800 mb-3">Notifications</h3>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No notifications
          </p>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="border p-3 rounded-lg hover:bg-gray-50">
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>

                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <FaCheck />
                  </button>

                  <button
                    onClick={() => deleteNotification(n._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
