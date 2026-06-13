import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import toast from "react-hot-toast";

//CSS module
import Style from '../../components/CSS/PageList.module.css';
import Button from "../../components/CSS/Button.module.css";
//UI Screens
import SingleSelect from "../../components/UI/SingleSelect";

//icon
import { RiArrowRightSLine } from "react-icons/ri";
import { IoCloudUploadOutline } from "react-icons/io5";
import { GoArrowRight } from "react-icons/go";
import { GoArrowLeft } from "react-icons/go";


export default function AddStudent(){
  const [currentStep, setCurrentStep] = useState(1);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [selectBox, setSelectBox] = useState("");
  const classOptions = [
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
  ];
  const steps = [
    "Personal Information",
    "Parent Information",
    "Address Information",
    "Documents Upload",
  ];
//next step  
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
//prev step  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
//student photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStudentPhoto(URL.createObjectURL(file));
    }
  };
  

  return(
    <>
      <div className={Style.pageHeader}>
        <h2>Add Student</h2>
        <ul className={"flex-align "}>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><RiArrowRightSLine /></li>
          <li><Link to="/students">Students</Link></li>
          <li><RiArrowRightSLine /></li>
          <li>Add Student</li>
        </ul>
      </div>
      <div className={Style.boxCard}>
        <div className={Style.formBody}>
          <div className={Style.stepBar}>
            {steps.map((step, index)=>(
              <button 
                type="button"
                key={index}
                className={currentStep === index + 1 ? Style.active : ""}
              >
                <span className={Style.stepNumber}>{index + 1}</span>
                <span className={Style.steptitle}>{step}</span>
              </button>
            ))}
            
          </div>
          <div className={Style.formContent}>
            {currentStep === 1 && (
              <>
                <div className={Style.rowLayout}>
                  <div className={Style.photoColumn}>
                    <h3 className={Style.formHeading}>Personal Information</h3>
                    <label>Student Photo</label>
                    <div className={Style.uploadPhoto}>
                      {studentPhoto ? (
                        <img
                          src={studentPhoto}
                          alt=""
                          className="preview-image"
                        />
                      ) : (
                        <div>
                          <span className={Style.icon}><IoCloudUploadOutline /></span>
                          <h5>Upload Photo</h5>
                          <span>JPG, PNG (Max 2MB)</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  </div>
                  <div className={Style.fieldsContainer}>
                      <div className={Style.containerGap}>
                        <div className={Style.fieldRow}>
                          <div className={Style.fieldColumn}>
                            <label>Admission No *</label>
                            <input type="text" className="form-control" value="" placeholder="Admission No"/>
                          </div>
                          <div className={Style.fieldColumn}>
                            <label>Class *</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Class"
                            />
                          </div>
                          <div className={Style.fieldColumn}>
                            <label>Section *</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Section"
                            />
                          </div>
                        </div>
                        <div className={Style.fieldRow}>
                          <div className={Style.fieldColumn}>
                            <label>Student Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter student full name"
                            />
                          </div>
                          <div className={Style.fieldColumn}>
                            <label>Gender *</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Gender"
                            />
                          </div>
                          <div className={Style.fieldColumn}>
                            <label>DOB *</label>
                            <input
                              type="date"
                              className="form-control"
                              placeholder="Select Date "
                            />
                          </div>
                        </div>
                        <div className={Style.fieldRow}>
                          <div className={Style.fieldColumn}>
                            <label>Blood Group</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Blood Group"
                            />
                          </div>

                          <div className={Style.fieldColumn}>
                            <label>Category</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Category"
                            />
                          </div>

                          <div className={Style.fieldColumn}>
                            <label>Religion</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Religion"
                            />
                          </div>
                        </div>
                        <div className={Style.fieldRow}>
                          <div className={Style.fieldColumn}>
                            <label>Nationality</label>
                            <SingleSelect
                              options={classOptions}
                              value={selectBox}
                              onChange={setSelectBox}
                              placeholder="Select Nationality"
                            />
                          </div>

                          <div className={Style.fieldColumn}>
                            <label>Aadhar No</label>
                            <input type="text" className="form-control" placeholder="Enter Aadhar No" />
                          </div>

                          <div className={Style.fieldColumn}>
                            <label>Apaar ID</label>
                            <input type="text" className="form-control" placeholder="Enter Apaar ID" />
                          </div>
                        </div>
                        <div className={Style.fieldRow}>
                          <div className={Style.fieldColumn}>
                            <label>PEN</label>
                            <input type="text" className="form-control" placeholder="Enter PEN" />
                          </div>

                          <div className={Style.fieldColumn}>
                            <label>SRN No</label>
                            <input type="text" className="form-control"  placeholder="Enter SRN No"/>
                          </div>

                          <div className={Style.fieldColumn}>
                            <label>Family ID</label>
                            <input type="text" className="form-control" placeholder="Enter Family ID" />
                          </div>
                        </div>
                        <div className={Style.fieldRow}>
                          <div className={`${Button.flexRight} ${Button.btnSpace}`}>
                            <button className={Button.btn + " " + Button.borderBtn}>Cancel</button>
                            <button className={Button.btn + " " + Button.primaryBtn} onClick={nextStep}>
                              Next <span className={Button.iconRight}><GoArrowRight /></span>
                            </button>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </>
            )}
            {currentStep === 2 && (
              <div className={`${Style.rowLayout} ${Style.rowFlex}`}>
                <h3 className={Style.formHeading}>Parent Information</h3>
                <div className={Style.fieldsContainer}>
                  <div className={Style.containerGap}>
                    <div className={Style.fieldRow}>
                      <div className={Style.fieldColumn}>
                        <label>Father Name *</label>
                        <input type="text" className="form-control" value="" placeholder="Name"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Mother Name *</label>
                        <input type="text" className="form-control" value="" placeholder="Name"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Mobile Number  *</label>
                        <input type="text" className="form-control" value="" placeholder="Mobile No."/>
                      </div>
                    </div>
                    <div className={Style.fieldRow}>
                      <div className={Style.fieldColumn}>
                        <label>Guardian Name</label>
                        <input type="text" className="form-control" value="" placeholder="Name"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Guardian Relation</label>
                        <input type="text" className="form-control" value="" placeholder="Relation"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Guardian Mobile Number</label>
                        <input type="text" className="form-control" value="" placeholder="Mobile No."/>
                      </div>
                    </div>
                    <div className={Style.fieldRow}>
                      <div className={Style.fieldColumn}>
                        <label>Emergency Contact Name *</label>
                        <input type="text" className="form-control" value="" placeholder="Name"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Emergency Contact Number *</label>
                        <input type="text" className="form-control" value="" placeholder="Mobile No."/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Emergency Contact Relation *</label>
                        <input type="text" className="form-control" value="" placeholder="Relation"/>
                      </div>
                    </div>
                    
                    <div className={Style.fieldRow}>
                        <div className={`${Button.flexRight} ${Button.btnSpace}`}>
                          <button className={Button.btn + " " + Button.borderBtn} onClick={prevStep}>
                            <span className={Button.icon}><GoArrowLeft /></span>Back
                          </button>
                          <button className={Button.btn + " " + Button.primaryBtn} onClick={nextStep}>
                            Next <span className={Button.iconRight}><GoArrowRight /></span>
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className={`${Style.rowLayout} ${Style.rowFlex}`}>
                <h3 className={Style.formHeading}>Address Information</h3>
                <div className={Style.fieldsContainer}>
                  <div className={Style.containerGap}>
                    <div className={Style.fieldRow}>
                      <div className={Style.fieldColumn}>
                        <label>Address Line 1 *</label>
                        <input type="text" className="form-control" value="" placeholder="Address"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Address Line 2</label>
                        <input type="text" className="form-control" value="" placeholder="Address"/>
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Country *</label>
                        <SingleSelect
                          options={classOptions}
                          value={selectBox}
                          onChange={setSelectBox}
                          placeholder="Select Country"
                        />
                      </div>
                    </div>
                    <div className={Style.fieldRow}>
                      <div className={Style.fieldColumn}>
                        <label>State *</label>
                        <SingleSelect
                          options={classOptions}
                          value={selectBox}
                          onChange={setSelectBox}
                          placeholder="Select State"
                        />
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>District *</label>
                        <SingleSelect
                          options={classOptions}
                          value={selectBox}
                          onChange={setSelectBox}
                          placeholder="Select District"
                        />
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>City *</label>
                        <SingleSelect
                          options={classOptions}
                          value={selectBox}
                          onChange={setSelectBox}
                          placeholder="Select City"
                        />
                      </div>
                      <div className={Style.fieldColumn}>
                        <label>Pincode *</label>
                        <input type="text" className="form-control" value="" placeholder="Pincode"/>
                      </div>
                    </div>                   
                    <div className={Style.fieldRow}>
                        <div className={`${Button.flexRight} ${Button.btnSpace}`}>
                          <button className={Button.btn + " " + Button.borderBtn} onClick={prevStep}>
                            <span className={Button.icon}><GoArrowLeft /></span>Back
                          </button>
                          <button className={Button.btn + " " + Button.primaryBtn} onClick={nextStep}>
                            Next <span className={Button.iconRight}><GoArrowRight /></span>
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}