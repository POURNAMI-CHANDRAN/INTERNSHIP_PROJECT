import Project from "../models/Project.js";
import Notification from "../models/Notification.js";

/* ================= GET PROJECTS ================= */

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .lean();

    const enrichedProjects = projects.map((project) => ({
      ...project,
      targetFTE: project.targetFTE || 0,
      targetHours: (project.targetFTE || 0) * 160,
    }));

    res.status(200).json({
      success: true,
      count: enrichedProjects.length,
      data: enrichedProjects,
    });
  } catch (err) {
    next(err);
  }
};

/* ================= CREATE PROJECT ================= */

export const createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);

    const io = req.app.get("io");

    const notification = await Notification.create({
      title: "New Project Created",
      message: `${project.name} was created successfully 🚀`,
      type: "project",
    });

    io.emit("new_notification", notification);

    res.status(201).json({
      success: true,
      message: "Project Created Successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE PROJECT ================= */

export const updateProject = async (req, res, next) => {
  try {
    const { allowAllocations, allowMoves, ...rest } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: rest },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project Updated Successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

/* ================= CHANGE STATUS ================= */

export const changeProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "PLANNED",
      "ACTIVE",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Project Status",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project Not Found",
      });
    }

    if (project.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed Projects Cannot Change Status",
      });
    }

    project.status = status;
    await project.save();

    res.status(200).json({
      success: true,
      message: `Project moved to ${status}`,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

/* ================= ARCHIVE PROJECT ================= */
export const archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project Not Found",
      });
    }

    if (project.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed Projects Cannot Be Archived",
      });
    }

    project.status = "CANCELLED";
    await project.save();

    res.status(200).json({
      success: true,
      message: "Project Archived Successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};
/* ================= UPDATE TARGET FTE ================= */

export const updateTargetFTE = async (req, res, next) => {
  try {

    const targetFTE = Number(req.body.targetFTE);

    if (isNaN(targetFTE) || targetFTE < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Target FTE",
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $set: { targetFTE },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Target FTE Updated Successfully",
      data: project,
    });

  } catch (err) {
    next(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};