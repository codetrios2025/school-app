import React, { useState, useRef, useEffect } from "react";
import Style from "./Login.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Please enter your username or email";
    }
    setErrors(newErrors);
}
  return (
    <div className={Style.forgotPasswordWrap}>
      <h2>Reset your password</h2>
      <p>Please enter your email address to reset your password.</p>
      <form>
        <div className={Style.formGroup}>
          <input 
            ref={emailRef}
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }} 
            placeholder="Enter email" 
            className={errors.email ? Style.inputError : ""}
          />
          {errors.email && (<span className={Style.errorMsg}>{errors.email}</span>)}
        </div>
        <button type="submit" onClick={handleSubmit} className={Style.loginButton}>Send Reset Link</button>
      </form>
    </div>
  );
}