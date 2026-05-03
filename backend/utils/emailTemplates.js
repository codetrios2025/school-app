exports.userWelcomeTemplate = ({ name, email, password, role, loginUrl }) => {
  return `
  <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #ddd; padding:20px;">
    
    <h2 style="color:#4f46e5;">🎓 Welcome to School App</h2>

    <p>Hello <b>${name}</b>,</p>

    <p>Your account has been created successfully.</p>

    <h3 style="margin-top:20px;">🔐 Login Details</h3>

    <p><b>Email:</b> ${email}</p>
    <p><b>Password:</b> ${password}</p>

    <div style="margin:20px 0;">
      <a href="${loginUrl}" 
         style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
         Login Now
      </a>
    </div>

    <p style="color:#555;">
      Please login and change your password after first login.
    </p>

    <hr/>

    <p style="font-size:12px;color:#888;">
      If you didn’t request this, please ignore this email.
    </p>

  </div>
  `;
};

exports.teacherAssignmentTemplate = ({
  teacherName,
  assignmentTitle,
  description,
  className,
  section,
  subject,
  loginUrl,
  actionType, // "assigned" or "updated"
}) => {
  return `
  <div style="font-family:Arial; max-width:600px; margin:auto; border:1px solid #eee; padding:20px;">
    
    <h2 style="color:#4f46e5;">📘 Assignment ${actionType}</h2>

    <p>Hello <b>${teacherName}</b>,</p>

    <p>An assignment has been <b>${actionType}</b> for you.</p>

    <div style="background:#f9fafb;padding:15px;border-radius:8px;margin-top:15px;">
      <p><b>Title:</b> ${assignmentTitle}</p>
      <p><b>Description:</b> ${description || "-"}</p>
      <p><b>Class:</b> ${className} - ${section}</p>
      <p><b>Subject:</b> ${subject}</p>
    </div>

    <div style="margin-top:20px;">
      <a href="${loginUrl}" 
         style="background:#4f46e5;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;">
         View in Dashboard
      </a>
    </div>

    <p style="margin-top:20px;color:#555;">
      Please login to manage or review the assignment.
    </p>

    <hr/>

    <p style="font-size:12px;color:#888;">
      School App Notification System
    </p>

  </div>
  `;
};
