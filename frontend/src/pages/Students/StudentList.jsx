import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import toast from "react-hot-toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import StudentModal from "../../components/StudentModal";

//CSS module
import Style from '../../components/CSS/PageList.module.css';
import Button from "../../components/CSS/Button.module.css";
//UI Screens
import SingleSelect from "../../components/UI/SingleSelect";

//icon
import { RiArrowRightSLine } from "react-icons/ri";
import { HiUserGroup } from "react-icons/hi";
import { TbManFilled } from "react-icons/tb";
import { TbWomanFilled } from "react-icons/tb";
import { MdSchool } from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import { FiRotateCcw } from "react-icons/fi";
import { VscOpenPreview } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";
import { CiEdit } from "react-icons/ci";
import { RiDeleteBinLine } from "react-icons/ri";


export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const classOptions = [
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
  ];
//Reset Filters Handler
  const handleReset = () => {
    setSearch("");
    setClassId("");
    setSectionId("");
    setStatus("");
    setGender("");
  };

  // 🔄 Fetch Students
  const fetchStudents = async () => {
    const res = await API.get(
      `/students?page=${page}&limit=6&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
    );

    setStudents(res.data.data);
    setTotalPages(res.data.totalPages);
    setTotalRecords(res.data.total);
  };
  console.log(students)
  // 🔄 Fetch Classes (for dropdown)
  const fetchClasses = async () => {
    const res = await API.get("/classes");
    setClasses(res.data.data);
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [page, search, sortField, sortOrder]);

  // 🔀 Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ➕ Add / Update
  const handleSubmit = async (form) => {
    try {
      if (editData) {
        await API.put(`/students/${editData._id}`, form);
        toast.success("Student Updated Successfully");
      } else {
        await API.post("/students", form);
        toast.success("Student Added Successfully");
      }

      setModalOpen(false);
      setEditData(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  // ✏️ Edit
  const handleEdit = (item) => {
    setEditData({
      ...item,
      classId: item.classId?._id,
    });
    setModalOpen(true);
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete student?")) return;

    await API.delete(`/students/${id}`);
    toast.success("Deleted");
    fetchStudents();
  };

  // Data Table
  const columns = [
  {
    name: "#",
    width: "80px",
    cell: (row, index) => (page - 1) * 6 + index + 1,
  },
  {
    name: "Name",
    selector: (row) => row.userId?.name || "-",
    sortable: true,
  },
  {
    name: "Email",
    selector: (row) => row.userId?.email || "-",
    sortable: true,
  },
  {
    name: "Roll",
    selector: (row) => row.rollNumber,
    sortable: true,
  },
  {
    name: "Class",
    selector: (row) =>
      row.classId
        ? `${row.classId.className} - ${row.classId.section}`
        : "-",
  },
  {
    name: "Parent Name",
    selector: (row) => row.parentName || "-",
  },
  {
    name: "Parent Email",
    selector: (row) => row.parentEmail || "-",
  },
  {
    name: "Contact",
    selector: (row) => row.contactNumber || "-",
  },
  {
    name: "Actions",
    center: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleEdit(row)}
          className="p-2 border rounded-md text-blue-600 hover:bg-blue-50"
        >
          <FaEdit size={14} />
        </button>

        <button
          onClick={() => handleDelete(row._id)}
          className="p-2 border rounded-md text-red-600 hover:bg-red-50"
        >
          <FaTrash size={14} />
        </button>
      </div>
    ),
  },
];

  return (
    <>
      {/* HEADER */}
      <div className={Style.pageHeader}>
        <div className={Style.headtitle}>
          <h2>Students List</h2>
          <ul className={"flex-align "}>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><RiArrowRightSLine /></li>
            <li>Students</li>
          </ul>
        </div>
        <div className={'flex-align ' + Style.pageInfo}>
          <div className={Style.infoCard}>
            <div className={Style.infoIcon} >
              <HiUserGroup />
            </div>
            <div className={Style.infoContent}>
              <h3>Total Students</h3>
              <p>1,250</p>
            </div>
          </div>
          <div className={Style.infoCard}>
            <div className={Style.infoIcon} >
              <TbManFilled />
            </div>
            <div className={Style.infoContent}>
              <h3>Boys</h3>
              <p>650</p>
            </div>
          </div>
          <div className={Style.infoCard}>
            <div className={Style.infoIcon} >
              <TbWomanFilled />
            </div>
            <div className={Style.infoContent}>
              <h3>Girls</h3>
              <p>600</p>
            </div>
          </div>
        </div>
      </div>
      <div className={Style.pageListing + " " + Style.boxCard }>
          <div className={Style.listingHeader}>
            <div className={Style.listFilter}>
              <div className={Style.filterSearch}>
                <input type="text"  value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, admission no..." />
              </div>
              <div className={Style.filterSelect}>
                <SingleSelect
                  options={classOptions}
                  value={classId}
                  onChange={setClassId}
                  placeholder="Class"
                />
              </div>
              <div className={Style.filterSelect}>
                <SingleSelect
                  options={classOptions}
                  value={classId}
                  onChange={setSectionId}
                  placeholder="Section"
                />
              </div>
              <div className={Style.filterSelect}>
                <SingleSelect
                  options={classOptions}
                  value={classId}
                  onChange={setStatus}
                  placeholder="Status"
                />
              </div>
              <div className={Style.filterSelect}>
                <SingleSelect
                  options={classOptions}
                  value={classId}
                  onChange={setGender}
                  placeholder="Gender"
                />
              </div>
            </div>
            <div className={'flex-align ' + Style.pageButton + " " + Button.buttonGap}>
              <button className={Button.btn + " " + Button.borderBtn} onClick={handleReset}>
                <span className={Button.icon}><FiRotateCcw /></span> Reset
              </button>
              <button onClick={() => { setEditData(null); setModalOpen(true);}} className={Button.btn + " " + Button.primaryBtn}>
                <span className={Button.icon}><LuPlus /></span> Add Student
              </button>
              <Link to='/students/add-student'>Add Student</Link>
            </div>
          </div>
          <div className={'tableStyle ' +Style.listBody}>
            <DataTable
              value={students}
              stripedRows
              showGridlines
              responsiveLayout="scroll"
              emptyMessage="No students found"
              className="student-table"
            >
              <Column
                header="#"
                body={(rowData, { rowIndex }) => (page - 1) * 6 + rowIndex + 1}
              />
              <Column frozen
                header="Student Name"
                style={{whiteSpace: "nowrap",overflow: "hidden",textOverflow: "ellipsis",}}
                body={(rowData) => rowData?.userId?.name || "-"}
              />
              <Column
                header="Admission No"
                style={{whiteSpace: "nowrap",overflow: "hidden",textOverflow: "ellipsis",}}
                body={(rowData) => rowData?.userId?.admissionNo || "01234"}
              />
              <Column
                header="Class"
                body={(rowData) => rowData?.classId?.className || "-"}
              />
              <Column
                header="Section"
                body={(rowData) => rowData?.classId?.section || "-"}
              />
              <Column
                header="Roll"
                body={(rowData) => rowData?.rollNumber || "-"}
              />
              <Column
                header="Email"
                body={(rowData) => rowData?.userId?.email || "-"}
              />
              <Column
                header="Father Name"
                body={(rowData) => rowData?.parentName || "-"}
              />
              <Column
                header="Mobile No"
                body={(rowData) => rowData?.contactNumber || "-"}
              />
              <Column
                header="Actions"
                body={(rowData) => (
                  <div className={'flex-align actionBtnGroup'}>
                    <button type="button" className="actionbtn blueBg">
                      <span><VscOpenPreview /></span>
                    </button>
                    <button type="button" className="actionbtn blueBg" onClick={() => {handleEdit(rowData);setModalOpen(true);}}>
                      <span><CiEdit /></span>
                    </button>
                    <button type="button" className="actionbtn dangerBg" onClick={() => handleDelete(rowData._id)}>
                      <span><RiDeleteBinLine  /></span>
                    </button>
                  </div>
                )}
              />
            </DataTable>
          </div>
      </div>

      {/* TABLE */}
      

      {/* MODAL */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editData}
        classes={classes}
      />
    </>
  );
}
