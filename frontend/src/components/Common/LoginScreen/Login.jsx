import { useFormik } from "formik";
import { useState, useEffect, useRef } from "react";
import * as Yup from "yup";
import API from "../../../services/api.js";
import AuthLayout from "../../AuthLayout.jsx";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../../../features/auth/authSlice.js";
import { useNavigate, Link } from "react-router-dom";
import Style from "./Login.module.css";
import Logo from '../../../assets/images/school-logo.png';
//Screen
import ForgotPassword from "./ForgotPassword.jsx";
//Icon
import { IoEye, IoEyeOff  } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";


export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Load saved email
  useEffect(() => {
  const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      formik.setFieldValue("email", savedEmail);
      setRemember(true);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  }

  const formik = useFormik({
     initialValues: { email: "", password: "",},
    validationSchema: Yup.object({
      email: Yup.string().email().required("Please enter your username or email"),
      password: Yup.string().required("Please enter your password"),
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
        console.log(res.data)
      } catch(err) {
        setError(err?.res?.data?.message || "Invalid credentials" )
      }
    },
  });

  return (
    <AuthLayout>
      <div className={Style.loginWrap}>
        <div className={Style.loginContainer}>
          <div className={Style.loginBox}>
            <div className={Style.schoolLogo}>
              <img src={Logo} alt="School Logo" className={Style.logo} />
              {showForgotPassword && (
                <button className={Style.backButton} onClick={() => setShowForgotPassword(false)}>
                  <IoIosArrowBack />
                </button>
              )}
            </div>
            {!showForgotPassword ? (
              <>
                <h2>School management</h2>
                {error && <div style={{ color: "red" }}>{error}</div>}
                <form  onSubmit={formik.handleSubmit}>
                  <div className={Style.formGroup}>
                    <input 
                      ref={emailRef}
                      type="text"
                      name="email"
                      value={formik.values.email}
                      onChange={(e)=>{
                        formik.handleChange(e);
                        if (formik.errors.email) {
                          formik.setFieldError("email", "");
                        }
                        if (remember) { // save only if remember checked
                          localStorage.setItem("rememberEmail", e.target.value);
                        }
                      }}
                      onBlur={formik.handleBlur}
                      placeholder="Enter the name of school" 
                      className={formik.touched.email && formik.errors.email ? Style.inputError : ""}
                    />
                    {formik.touched.email && formik.errors.email && (
                      <span className={Style.errorMsg}>
                        {formik.errors.email}
                      </span>
                    )}

                  </div>
                  <div className={Style.formGroup}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      value={formik.values.password}
                      onChange={(e)=>{
                        formik.handleChange(e);
                        
                         if (formik.errors.password) {
                            formik.setFieldError("password", "");
                          }
                      }}
                      onBlur={formik.handleBlur}
                      placeholder="Enter password" 
                      className={formik.touched.password && formik.errors.password ? Style.inputError : ""}
                    />
                    <span className={Style.passwordToggle} onClick={togglePasswordVisibility}>
                      {showPassword ? <IoEyeOff /> : <IoEye />}
                    </span>
                    {formik.touched.password && formik.errors.password && (
                      <span className={Style.errorMsg}>
                        {formik.errors.password}
                      </span>
                    )}
                  </div>
                  <div className={Style.rememberForgot}>
                    <label>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRemember(checked);
                          if (!checked) {
                            localStorage.removeItem("rememberEmail");
                          } else {
                            localStorage.setItem(
                              "rememberEmail",
                              formik.values.email
                            );
                          }
                        }}
                      /> Remember me
                    </label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className={Style.forgotButton}>
                      Forgot password?
                    </button>
                  </div>
                  <button type="submit" className={Style.loginButton}>
                    Login
                  </button>
                </form>
              </>
            ) : (
              <ForgotPassword />
            )}
          </div>
        </div>
        <div className={Style.pictureContainer}>

        </div>
      </div>
    </AuthLayout>
  );
}
