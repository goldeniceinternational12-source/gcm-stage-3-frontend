import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import gcmLogo from "../../assets/images/gcm-logo.png";

import "./AdminCourseLessons.css";


const EMPTY_FORM = {
  lessonNumber: 1,
  title: "",
  description: "",
  content: "",
  assignmentRequired: false,
  completionRequired: true,
};


function AdminCourseLessons() {

  const navigate = useNavigate();

  const { courseId } = useParams();


  // ==========================================================
  // STATE
  // ==========================================================

  const [course, setCourse] =
    useState(null);

  const [lessons, setLessons] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const [showModal, setShowModal] =
    useState(false);

  const [editingLesson, setEditingLesson] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);


  const [existingMaterials, setExistingMaterials] =
    useState([]);

  const [selectedFiles, setSelectedFiles] =
    useState([]);


  // ==========================================================
  // AUTH
  // ==========================================================

  const token =
    localStorage.getItem(
      "gcm_admin_token"
    );


  // ==========================================================
  // LOAD PAGE
  // ==========================================================

  useEffect(() => {

    if (!token) {

      navigate(
        "/admin/login",
        {
          replace: true,
        }
      );

      return;
    }


    if (!courseId) {

      setError(
        "No course was selected."
      );

      setLoading(false);

      return;
    }


    loadPage();

  }, [
    courseId,
    token,
  ]);


  // ==========================================================
  // LOAD COURSE + LESSONS
  // ==========================================================

  const loadPage = async () => {

    try {

      setLoading(true);
      setError("");


      const [
        courseResponse,
        lessonsResponse,
      ] = await Promise.all([
        api.get(
          `/courses/${courseId}`
        ),

        api.get(
          `/lessons/course/${courseId}`
        ),
      ]);


      const courseData =
        courseResponse.data || {};

      const lessonsData =
        lessonsResponse.data || {};


      const loadedCourse =
        courseData.course ||
        courseData.data?.course ||
        courseData;


      const loadedLessons =
        Array.isArray(
          lessonsData.lessons
        )
          ? lessonsData.lessons
          : Array.isArray(
              lessonsData.data?.lessons
            )
          ? lessonsData.data.lessons
          : Array.isArray(
              lessonsData
            )
          ? lessonsData
          : [];


      if (!loadedCourse) {

        throw new Error(
          "Course information could not be loaded."
        );

      }


      setCourse(
        loadedCourse
      );


      setLessons(
        loadedLessons.sort(
          (a, b) =>
            Number(
              a.lessonNumber || 0
            ) -
            Number(
              b.lessonNumber || 0
            )
        )
      );


    } catch (err) {

      console.error(
        "Load course lessons error:",
        err
      );


      const status =
        err.response?.status;


      if (status === 401) {

        localStorage.removeItem(
          "gcm_admin_token"
        );

        localStorage.removeItem(
          "gcm_admin"
        );

        navigate(
          "/admin/login",
          {
            replace: true,
          }
        );

        return;
      }


      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load the course lessons."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // LESSON STATISTICS
  // ==========================================================

  const statistics =
    useMemo(() => {

      const total =
        lessons.length;

      const published =
        lessons.filter(
          (lesson) =>
            lesson.isPublished === true
        ).length;

      const drafts =
        lessons.filter(
          (lesson) =>
            lesson.isPublished !== true &&
            lesson.status !== "INACTIVE"
        ).length;

      const inactive =
        lessons.filter(
          (lesson) =>
            lesson.status === "INACTIVE"
        ).length;


      return {
        total,
        published,
        drafts,
        inactive,
      };

    }, [lessons]);


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange =
    (event) => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;


      setForm(
        (previous) => ({
          ...previous,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );

    };


  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {

    setForm({
      ...EMPTY_FORM,

      lessonNumber:
        lessons.length + 1,
    });

    setEditingLesson(
      null
    );

    setExistingMaterials(
      []
    );

    setSelectedFiles(
      []
    );

  };


  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  const openCreateModal = () => {

    setError("");
    setSuccess("");


    setEditingLesson(
      null
    );


    setForm({
      ...EMPTY_FORM,

      lessonNumber:
        lessons.length + 1,
    });


    setExistingMaterials(
      []
    );


    setSelectedFiles(
      []
    );


    setShowModal(
      true
    );

  };


  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const openEditModal =
    (lesson) => {

      setError("");
      setSuccess("");


      setEditingLesson(
        lesson
      );


      setForm({

        lessonNumber:
          lesson.lessonNumber ||
          1,

        title:
          lesson.title ||
          "",

        description:
          lesson.description ||
          "",

        content:
          lesson.content ||
          "",

        assignmentRequired:
          Boolean(
            lesson.assignmentRequired
          ),

        completionRequired:
          lesson.completionRequired !==
          false,

      });


      setExistingMaterials(
        Array.isArray(
          lesson.materials
        )
          ? lesson.materials.map(
              (material, index) => ({
                ...material,
                _localId:
                  `${material.publicId || material.url || index}-${index}`,
              })
            )
          : []
      );


      setSelectedFiles(
        []
      );


      setShowModal(
        true
      );

    };


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {

    if (
      saving ||
      uploading
    ) {
      return;
    }


    setShowModal(
      false
    );


    resetForm();

    setError("");

  };


  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  const handleFileSelection =
    (event) => {

      const files =
        Array.from(
          event.target.files || []
        );


      if (!files.length) {
        return;
      }


      const validFiles =
        files.filter(
          (file) => {

            const isPdf =
              file.type ===
              "application/pdf";

            const isVideo =
              file.type.startsWith(
                "video/"
              );


            return (
              isPdf ||
              isVideo
            );

          }
        );


      if (
        validFiles.length !==
        files.length
      ) {

        setError(
          "Only PDF and supported video files can be uploaded."
        );

      } else {

        setError("");

      }


      setSelectedFiles(
        (previous) => [
          ...previous,
          ...validFiles,
        ]
      );


      event.target.value =
        "";

    };


  // ==========================================================
  // REMOVE SELECTED FILE
  // ==========================================================

  const removeSelectedFile =
    (index) => {

      setSelectedFiles(
        (previous) =>
          previous.filter(
            (_, fileIndex) =>
              fileIndex !== index
          )
      );

    };


  // ==========================================================
  // REMOVE EXISTING MATERIAL
  // ==========================================================

  const removeExistingMaterial =
    (index) => {

      setExistingMaterials(
        (previous) =>
          previous.filter(
            (_, materialIndex) =>
              materialIndex !== index
          )
      );

    };


  // ==========================================================
  // UPLOAD ONE FILE
  // ==========================================================

  const uploadMaterial =
    async (file) => {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      const response =
        await api.post(
          "/uploads",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      const data =
        response.data || {};


      if (!response.data) {

        throw new Error(
          "Upload service returned an empty response."
        );

      }


      const uploaded =
        data.file ||
        data.data?.file;


      if (!uploaded?.url) {

        throw new Error(
          data.message ||
          "File upload failed."
        );

      }


      return {

        title:
          uploaded.originalName ||
          file.name,

        type:
          file.type ===
          "application/pdf"
            ? "PDF"
            : "VIDEO",

        url:
          uploaded.url,

        description:
          "",

        publicId:
          uploaded.publicId ||
          "",

      };

    };


  // ==========================================================
  // UPLOAD ALL NEW FILES
  // ==========================================================

  const uploadSelectedFiles =
    async () => {

      if (
        selectedFiles.length ===
        0
      ) {

        return [];

      }


      setUploading(
        true
      );


      try {

        const uploadedMaterials =
          [];


        for (
          const file
          of selectedFiles
        ) {

          const material =
            await uploadMaterial(
              file
            );


          uploadedMaterials.push(
            material
          );

        }


        return uploadedMaterials;

      } finally {

        setUploading(
          false
        );

      }

    };


  // ==========================================================
  // CREATE LESSON
  // ==========================================================

  const createLesson =
    async (materials) => {

      const payload = {

        // The backend may use courseId.
        courseId,

        lessonNumber:
          Number(
            form.lessonNumber
          ),

        title:
          form.title.trim(),

        description:
          form.description.trim(),

        content:
          form.content.trim(),

        materials,

        assignmentRequired:
          Boolean(
            form.assignmentRequired
          ),

        completionRequired:
          Boolean(
            form.completionRequired
          ),

      };


      const response =
        await api.post(
          "/lessons",
          payload
        );


      return response.data;

    };


  // ==========================================================
  // UPDATE LESSON
  // ==========================================================

  const updateLesson =
    async (
      lessonId,
      materials
    ) => {

      const payload = {

        lessonNumber:
          Number(
            form.lessonNumber
          ),

        title:
          form.title.trim(),

        description:
          form.description.trim(),

        content:
          form.content.trim(),

        materials,

        assignmentRequired:
          Boolean(
            form.assignmentRequired
          ),

        completionRequired:
          Boolean(
            form.completionRequired
          ),

      };


      const response =
        await api.patch(
          `/lessons/${lessonId}`,
          payload
        );


      return response.data;

    };


  // ==========================================================
  // SAVE LESSON
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      if (
        !form.title.trim()
      ) {

        setError(
          "Please enter a lesson title."
        );

        return;

      }


      if (
        !form.lessonNumber ||
        Number(
          form.lessonNumber
        ) < 1
      ) {

        setError(
          "Lesson number must be at least 1."
        );

        return;

      }


      setSaving(
        true
      );

      setError("");
      setSuccess("");


      try {

        // Upload new PDF/video files first.
        const newMaterials =
          await uploadSelectedFiles();


        const materials = [
          ...existingMaterials.map(
            (material) => {

              const cleanMaterial =
                {
                  title:
                    material.title ||
                    "",

                  type:
                    material.type ||
                    "OTHER",

                  url:
                    material.url ||
                    "",

                  description:
                    material.description ||
                    "",
                };


              return cleanMaterial;

            }
          ),

          ...newMaterials,
        ];


        if (
          editingLesson
        ) {

          const data =
            await updateLesson(
              editingLesson._id,
              materials
            );


          setSuccess(
            data.message ||
            "Lesson updated successfully."
          );

        } else {

          const data =
            await createLesson(
              materials
            );


          setSuccess(
            data.message ||
            "Lesson created successfully."
          );

        }


        await loadPage();


        setTimeout(
          () => {

            setShowModal(
              false
            );

            resetForm();

            setSuccess("");

          },
          900
        );


      } catch (err) {

        console.error(
          "Save lesson error:",
          err
        );


        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to save the lesson."
        );

      } finally {

        setSaving(
          false
        );

      }

    };


  // ==========================================================
  // PUBLISH / UNPUBLISH
  // ==========================================================

  const togglePublish =
    async (lesson) => {

      const currentlyPublished =
        lesson.isPublished === true;


      const action =
        currentlyPublished
          ? "unpublish"
          : "publish";


      const confirmed =
        window.confirm(
          `${
            currentlyPublished
              ? "Unpublish"
              : "Publish"
          } lesson "${lesson.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        const response =
          await api.patch(
            `/lessons/${lesson._id}/${action}`
          );


        setSuccess(
          response.data?.message ||
          `Lesson ${action}ed successfully.`
        );


        await loadPage();


        setTimeout(
          () => {
            setSuccess("");
          },
          1600
        );


      } catch (err) {

        console.error(
          "Publish lesson error:",
          err
        );


        setError(
          err.response?.data?.message ||
          err.message ||
          `Unable to ${action} the lesson.`
        );

      }

    };


  // ==========================================================
  // ACTIVATE / DEACTIVATE
  // ==========================================================

  const toggleStatus =
    async (lesson) => {

      const isActive =
        lesson.status !==
        "INACTIVE";


      if (!isActive) {

        const confirmed =
          window.confirm(
            `Activate lesson "${lesson.title}"?`
          );


        if (!confirmed) {
          return;
        }


        try {

          setError("");
          setSuccess("");


          const response =
            await api.patch(
              `/lessons/${lesson._id}`,
              {
                status:
                  "ACTIVE",
              }
            );


          setSuccess(
            response.data?.message ||
            "Lesson activated successfully."
          );


          await loadPage();


          setTimeout(
            () => {
              setSuccess("");
            },
            1600
          );


        } catch (err) {

          console.error(
            "Activate lesson error:",
            err
          );


          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to activate the lesson."
          );

        }


        return;

      }


      const confirmed =
        window.confirm(
          `Deactivate lesson "${lesson.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        const response =
          await api.patch(
            `/lessons/${lesson._id}/deactivate`
          );


        setSuccess(
          response.data?.message ||
          "Lesson deactivated successfully."
        );


        await loadPage();


        setTimeout(
          () => {
            setSuccess("");
          },
          1600
        );


      } catch (err) {

        console.error(
          "Deactivate lesson error:",
          err
        );


        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to deactivate the lesson."
        );

      }

    };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "gcm_admin_token"
    );

    localStorage.removeItem(
      "gcm_admin"
    );


    navigate(
      "/admin/login",
      {
        replace: true,
      }
    );

  };


  // ==========================================================
  // BACK TO COURSES
  // ==========================================================

  const backToCourses = () => {

    navigate(
      "/admin/courses"
    );

  };


  // ==========================================================
  // FORMAT FILE SIZE
  // ==========================================================

  const formatFileSize =
    (bytes) => {

      if (!bytes) {
        return "";
      }


      if (
        bytes <
        1024
      ) {

        return `${bytes} B`;

      }


      if (
        bytes <
        1024 * 1024
      ) {

        return `${(
          bytes / 1024
        ).toFixed(1)} KB`;

      }


      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;

    };


  // ==========================================================
  // FILE TYPE
  // ==========================================================

  const getFileType =
    (file) => {

      if (
        file.type ===
        "application/pdf"
      ) {

        return "PDF";

      }


      if (
        file.type.startsWith(
          "video/"
        )
      ) {

        return "VIDEO";

      }


      return "FILE";

    };


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (

      <main className="admin-lessons-page">

        <div className="admin-lessons-loading-page">

          <img
            src={gcmLogo}
            alt="Global College of Missiology"
            className="admin-lessons-loading-logo"
          />

          <div className="admin-lessons-loader"></div>

          <p>
            Loading course lessons...
          </p>

        </div>

      </main>

    );

  }


  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (

    <main className="admin-lessons-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="admin-lessons-header">

        <div className="admin-lessons-brand">

          <img
            src={gcmLogo}
            alt="Global College of Missiology"
          />

          <div>

            <span>
              GLOBAL COLLEGE OF MISSIOLOGY
            </span>

            <h1>
              Course Lessons
            </h1>

          </div>

        </div>


        <div className="admin-lessons-header-actions">

          <button
            type="button"
            onClick={
              backToCourses
            }
          >
            ← Courses
          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          >
            Dashboard
          </button>


          <button
            type="button"
            className="admin-lessons-signout"
            onClick={
              handleLogout
            }
          >
            Sign Out
          </button>

        </div>

      </header>


      {/* =====================================================
          COURSE INFORMATION
      ===================================================== */}

      <section className="admin-lessons-course-card">

        <div className="admin-lessons-course-main">

          <div className="admin-lessons-course-code">

            {course?.courseCode ||
              "COURSE"}

          </div>


          <div>

            <span className="admin-lessons-course-label">
              COURSE CONTENT
            </span>

            <h2>
              {course?.title ||
                "Untitled Course"}
            </h2>

            <p>
              {course?.description ||
                "Manage lessons and learning materials for this course."}
            </p>

          </div>

        </div>


        <div className="admin-lessons-course-meta">

          <div>

            <span>
              PROGRAMME
            </span>

            <strong>
              {course?.programme ||
                "—"}
            </strong>

          </div>


          <div>

            <span>
              ACADEMIC YEAR
            </span>

            <strong>
              {course?.academicYear ||
                "—"}
            </strong>

          </div>


          <div>

            <span>
              SEMESTER
            </span>

            <strong>
              {course?.semester ||
                "—"}
            </strong>

          </div>


          <div>

            <span>
              CREDIT UNITS
            </span>

            <strong>
              {course?.creditUnits ||
                "—"}
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="admin-lessons-stats">

        <div>

          <span>
            Total Lessons
          </span>

          <strong>
            {statistics.total}
          </strong>

        </div>


        <div>

          <span>
            Published
          </span>

          <strong>
            {statistics.published}
          </strong>

        </div>


        <div>

          <span>
            Drafts
          </span>

          <strong>
            {statistics.drafts}
          </strong>

        </div>


        <div>

          <span>
            Inactive
          </span>

          <strong>
            {statistics.inactive}
          </strong>

        </div>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="admin-lessons-content">

        <div className="admin-lessons-content-header">

          <div>

            <span>
              ACADEMIC MANAGEMENT
            </span>

            <h2>
              Lessons
            </h2>

            <p>
              Create structured lessons and attach
              PDF documents or video teaching materials.
            </p>

          </div>


          <button
            type="button"
            className="admin-lessons-add-button"
            onClick={
              openCreateModal
            }
          >
            <span>
              +
            </span>

            Add Lesson
          </button>

        </div>


        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (

          <div className="admin-lessons-alert error">

            <strong>
              Attention
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}


        {success && (

          <div className="admin-lessons-alert success">

            <span className="admin-lessons-alert-icon">
              ✓
            </span>

            <span>
              {success}
            </span>

          </div>

        )}


        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {lessons.length === 0 ? (

          <div className="admin-lessons-empty">

            <div className="admin-lessons-empty-icon">
              ◇
            </div>

            <h3>
              No lessons yet
            </h3>

            <p>
              Start building this course by creating
              the first lesson.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
            >
              + Create First Lesson
            </button>

          </div>

        ) : (

          /* =================================================
             LESSON LIST
          ================================================= */

          <div className="admin-lessons-list">

            {lessons.map(
              (lesson, index) => {

                const materials =
                  Array.isArray(
                    lesson.materials
                  )
                    ? lesson.materials
                    : [];


                return (

                  <article
                    className={
                      `admin-lesson-card ${
                        lesson.status ===
                        "INACTIVE"
                          ? "inactive"
                          : ""
                      }`
                    }
                    key={
                      lesson._id ||
                      index
                    }
                  >

                    {/* ======================================
                        NUMBER
                    ====================================== */}

                    <div className="admin-lesson-number">

                      <span>
                        LESSON
                      </span>

                      <strong>
                        {String(
                          lesson.lessonNumber ||
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </strong>

                    </div>


                    {/* ======================================
                        BODY
                    ====================================== */}

                    <div className="admin-lesson-body">

                      <div className="admin-lesson-title-row">

                        <div>

                          <h3>
                            {lesson.title}
                          </h3>

                          {lesson.description && (

                            <p>
                              {lesson.description}
                            </p>

                          )}

                        </div>


                        <div className="admin-lesson-statuses">

                          <span
                            className={
                              lesson.isPublished
                                ? "published"
                                : "draft"
                            }
                          >
                            {lesson.isPublished
                              ? "PUBLISHED"
                              : "DRAFT"}
                          </span>


                          <span
                            className={
                              lesson.status ===
                              "INACTIVE"
                                ? "inactive"
                                : "active"
                            }
                          >
                            {lesson.status ||
                              "ACTIVE"}
                          </span>

                        </div>

                      </div>


                      {/* ====================================
                          MATERIALS
                      ==================================== */}

                      {materials.length > 0 && (

                        <div className="admin-lesson-materials">

                          <div className="admin-lesson-material-heading">
                            MATERIALS
                          </div>


                          <div className="admin-lesson-material-list">

                            {materials.map(
                              (
                                material,
                                materialIndex
                              ) => (

                                <a
                                  key={
                                    material._id ||
                                    material.publicId ||
                                    material.url ||
                                    materialIndex
                                  }
                                  href={
                                    material.url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="admin-lesson-material"
                                >

                                  <span className="admin-lesson-material-icon">

                                    {material.type ===
                                    "PDF"
                                      ? "PDF"
                                      : material.type ===
                                        "VIDEO"
                                      ? "▶"
                                      : "↗"}

                                  </span>


                                  <span className="admin-lesson-material-info">

                                    <strong>
                                      {material.title ||
                                        "Learning Material"}
                                    </strong>

                                    <small>
                                      {material.type ||
                                        "FILE"}
                                    </small>

                                  </span>

                                </a>

                              )
                            )}

                          </div>

                        </div>

                      )}


                      {/* ====================================
                          ACTIONS
                      ==================================== */}

                      <div className="admin-lesson-actions">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              lesson
                            )
                          }
                        >
                          Edit
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            togglePublish(
                              lesson
                            )
                          }
                        >
                          {lesson.isPublished
                            ? "Unpublish"
                            : "Publish"}
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(
                              lesson
                            )
                          }
                        >
                          {lesson.status ===
                          "INACTIVE"
                            ? "Activate"
                            : "Deactivate"}
                        </button>

                      </div>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="admin-lessons-modal-overlay"
          onClick={closeModal}
        >

          <section
            className="admin-lessons-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ==============================================
                MODAL HEADER
            ============================================== */}

            <div className="admin-lessons-modal-header">

              <div>

                <span>
                  {editingLesson
                    ? "EDIT LESSON"
                    : "NEW LESSON"}
                </span>

                <h2>
                  {editingLesson
                    ? "Edit Lesson"
                    : "Create Lesson"}
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving ||
                  uploading
                }
              >
                ×
              </button>

            </div>


            {/* ==============================================
                FORM
            ============================================== */}

            <form
              className="admin-lessons-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="admin-lessons-form-grid">

                {/* LESSON NUMBER */}

                <div>

                  <label>
                    Lesson Number
                  </label>

                  <input
                    type="number"
                    name="lessonNumber"
                    min="1"
                    value={
                      form.lessonNumber
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving ||
                      uploading
                    }
                    required
                  />

                </div>


                {/* TITLE */}

                <div className="admin-lessons-form-wide">

                  <label>
                    Lesson Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Introduction to Mission"
                    disabled={
                      saving ||
                      uploading
                    }
                    required
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="admin-lessons-form-wide">

                  <label>
                    Short Description
                  </label>

                  <textarea
                    name="description"
                    rows="3"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Brief description of this lesson..."
                    disabled={
                      saving ||
                      uploading
                    }
                  />

                </div>


                {/* CONTENT */}

                <div className="admin-lessons-form-wide">

                  <label>
                    Lesson Content
                  </label>

                  <textarea
                    name="content"
                    rows="9"
                    value={
                      form.content
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Write the lesson content here..."
                    disabled={
                      saving ||
                      uploading
                    }
                  />

                </div>


                {/* OPTIONS */}

                <div className="admin-lessons-options">

                  <label className="admin-lessons-checkbox">

                    <input
                      type="checkbox"
                      name="completionRequired"
                      checked={
                        form.completionRequired
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving ||
                        uploading
                      }
                    />

                    <span>
                      Completion required
                    </span>

                  </label>


                  <label className="admin-lessons-checkbox">

                    <input
                      type="checkbox"
                      name="assignmentRequired"
                      checked={
                        form.assignmentRequired
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving ||
                        uploading
                      }
                    />

                    <span>
                      Assignment required
                    </span>

                  </label>

                </div>


                {/* EXISTING MATERIALS */}

                {existingMaterials.length >
                  0 && (

                    <div className="admin-lessons-form-wide">

                      <div className="admin-lessons-upload-heading">

                        <div>

                          <label>
                            Existing Materials
                          </label>

                          <small>
                            These materials will remain attached
                            unless you remove them.
                          </small>

                        </div>

                      </div>


                      <div className="admin-lessons-existing-materials">

                        {existingMaterials.map(
                          (
                            material,
                            index
                          ) => (

                            <div
                              className="admin-lessons-existing-material"
                              key={
                                material._localId ||
                                index
                              }
                            >

                              <div>

                                <span className="admin-lessons-file-badge">
                                  {material.type ===
                                  "PDF"
                                    ? "PDF"
                                    : material.type ===
                                      "VIDEO"
                                    ? "VIDEO"
                                    : "FILE"}
                                </span>

                                <div>

                                  <strong>
                                    {material.title ||
                                      "Material"}
                                  </strong>

                                  <small>
                                    {material.url}
                                  </small>

                                </div>

                              </div>


                              <button
                                type="button"
                                onClick={() =>
                                  removeExistingMaterial(
                                    index
                                  )
                                }
                                disabled={
                                  saving ||
                                  uploading
                                }
                              >
                                Remove
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                {/* FILE UPLOAD */}

                <div className="admin-lessons-form-wide">

                  <div className="admin-lessons-upload-heading">

                    <div>

                      <label>
                        Add PDF / Video Materials
                      </label>

                      <small>
                        You can select multiple PDF and
                        video files.
                      </small>

                    </div>

                  </div>


                  <label
                    className="admin-lessons-upload-box"
                  >

                    <input
                      type="file"
                      multiple
                      accept="application/pdf,video/*"
                      onChange={
                        handleFileSelection
                      }
                      disabled={
                        saving ||
                        uploading
                      }
                    />


                    <span className="admin-lessons-upload-icon">
                      ↑
                    </span>


                    <strong>
                      Select Files
                    </strong>

                    <small>
                      PDF, MP4, WebM, MOV and supported
                      video formats
                    </small>

                  </label>


                  {/* SELECTED FILES */}

                  {selectedFiles.length >
                    0 && (

                    <div className="admin-lessons-selected-files">

                      {selectedFiles.map(
                        (
                          file,
                          index
                        ) => (

                          <div
                            className="admin-lessons-selected-file"
                            key={
                              `${file.name}-${file.size}-${index}`
                            }
                          >

                            <div>

                              <span className="admin-lessons-file-badge">

                                {getFileType(
                                  file
                                )}

                              </span>


                              <div>

                                <strong>
                                  {file.name}
                                </strong>

                                <small>
                                  {formatFileSize(
                                    file.size
                                  )}
                                </small>

                              </div>

                            </div>


                            <button
                              type="button"
                              onClick={() =>
                                removeSelectedFile(
                                  index
                                )
                              }
                              disabled={
                                saving ||
                                uploading
                              }
                            >
                              Remove
                            </button>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>


              {/* ==========================================
                  MODAL ACTIONS
              ========================================== */}

              <div className="admin-lessons-modal-actions">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-lessons-save-button"
                  disabled={
                    saving ||
                    uploading
                  }
                >

                  {uploading
                    ? "Uploading Materials..."
                    : saving
                    ? "Saving Lesson..."
                    : editingLesson
                    ? "Save Changes"
                    : "Create Lesson"}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}

    </main>

  );
}


export default AdminCourseLessons;