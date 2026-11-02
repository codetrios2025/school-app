const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

exports.notificationEmailTemplate = ({
  schoolName,
  title,
  message,
  logoCid,
  email,
  phone,
  address,
  website,
  mapUrl,
}) => {
  const addressText = [address, mapUrl ? `<a href="${escapeHtml(mapUrl)}">View school location</a>` : ""]
    .filter(Boolean)
    .join(" · ");
  const contactText = [
    email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : "",
    phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : "",
    website ? `<a href="${escapeHtml(website)}">${escapeHtml(website)}</a>` : "",
  ].filter(Boolean).join(" · ");

  return `
    <div style="background:#f1f5f9;padding:32px 12px;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="background:#312e81;padding:24px 28px;color:#fff">
          ${logoCid ? `<img src="cid:${escapeHtml(logoCid)}" alt="${escapeHtml(schoolName)}" style="display:block;max-width:180px;max-height:64px;object-fit:contain;margin-bottom:16px">` : ""}
          <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.8">School notification</div>
          <h1 style="font-size:22px;line-height:1.35;margin:8px 0 0">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px">
          <p style="font-size:15px;line-height:1.7;white-space:pre-line;margin:0">${escapeHtml(message)}</p>
        </div>
        <div style="border-top:1px solid #e2e8f0;background:#f8fafc;padding:20px 28px">
          <strong style="font-size:14px;color:#312e81">${escapeHtml(schoolName)}</strong>
          ${addressText ? `<div style="font-size:12px;line-height:1.6;color:#475569;margin-top:6px">${addressText}</div>` : ""}
          ${contactText ? `<div style="font-size:12px;line-height:1.6;color:#475569;margin-top:4px">${contactText}</div>` : ""}
        </div>
      </div>
      <div style="max-width:620px;margin:12px auto 0;text-align:center;font-size:11px;color:#64748b">Sent through the school notification system.</div>
    </div>
  `;
};

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
