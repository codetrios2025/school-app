import React from "react";

const TimeAgoFormat = ({ date }) => {
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const inputDate = new Date(dateString);

    const seconds = Math.floor((now - inputDate) / 1000);

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    if (weeks < 5) {
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }

    if (months < 12) {
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }

    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  return <span>{formatTimeAgo(date)}</span>;
};

export default TimeAgoFormat;

// import React from "react";

// const TimeAgoFormat = ({ date }) => {
//   const formatDate = (dateString) => {
//     const inputDate = new Date(dateString);

//     const datePart = inputDate.toLocaleDateString("en-US", {
//       month: "long",
//       day: "numeric",
//       year: "numeric",
//     });

//     const timePart = inputDate.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });

//     return `${datePart} - ${timePart}`;
//   };

//   return <span>{formatDate(date)}</span>;
// };

// export default TimeAgoFormat;