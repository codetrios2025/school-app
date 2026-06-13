import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setNotifications,
  resetCount,
} from "../../features/notification/notificationSlice";
import API from "../../services/api";
import TimeAgo from './TimeAgoFormat'
//CSS
import Style from './Notification.module.css';
import Button from '../CSS/Button.module.css';
import { FaCheck, FaTrash } from "react-icons/fa";
import { HiOutlineExternalLink } from "react-icons/hi";
import { AiFillAlert } from "react-icons/ai";



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
    <>
    <div className={Style.notifContainer}>
      <div className={"flex-align " + Style.notifHead}>
        <h3>Notifications</h3>
        <button type="button" className={Button.planButton}>Mark all as read</button>
      </div>
      <div className={Style.notifList}>
        {notifications.length === 0 ? (
          <h6>No notifications</h6>
        ) : (
          notifications?.slice(0, 6).map((n) =>(
            <div className={Style.notifItem} key={n._id}>
              <div className={"flex-align " + Style.notifIcon}>
                <AiFillAlert />
              </div>
              <div className={Style.notifDetail}>
                <div className={Style.notifTitle}>
                  <span className={Style.title}>{n.title}</span>
                  <span className={Style.date}><TimeAgo date={n.createdAt} /></span>
                </div>
                <div className={Style.notifMessage}>
                  {n.message}
                </div>
              </div>
              {/*<div className={Style.notifElem}>
                 <div className="flex gap-1 text-xs">
                  <button onClick={() => markAsRead(n._id)}><FaCheck /></button>
                  <button onClick={() => deleteNotification(n._id)}><FaTrash /></button>
                </div> 
              </div>*/}
            </div>
          ))
        )}
      </div>
      <div className={Style.notifFooter}>
        <button type="button" className={Button.planButton}>
          <span className={Button.icon}><HiOutlineExternalLink /></span> View all notifications
        </button>
      </div>
    </div>
    {/* <div className="absolute right-0 mt-3 w-96 bg-white shadow-xl rounded-xl p-4 z-50 border">
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
                  <TimeAgo date={n.createdAt} />
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
    </div> */}
    </>
  );
}
 