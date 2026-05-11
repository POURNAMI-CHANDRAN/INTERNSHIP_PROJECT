import Skill from "../models/Skill.js";
import EmployeeSkill from "../models/EmployeeSkill.js";

/* ================= CREATE SKILL ================= */

export const createSkill = async (req, res) => {
  try {
    const { name, skill_name, category } = req.body;

    const finalName = (name || skill_name || "").trim();

    console.log("FINAL NAME:", finalName);

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: "Skill Name is Required",
      });
    }

    // CHECK EXISTING SKILL
    const existing = await Skill.findOne({
      name: {
        $regex: new RegExp(`^${finalName}$`, "i"),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${finalName} already Exists`,
      });
    }

    // CREATE SKILL
    const skill = await Skill.create({
      name: finalName,
      category: category || "General",
      status: "Active",
    });

    res.status(201).json({
      success: true,
      message: "Skill Created Successfully",
      data: skill,
    });

  } catch (err) {
    console.log("CREATE SKILL ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= GET ALL SKILLS ================= */

export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({
      name: 1,
    });

    res.json({
      success: true,
      count: skills.length,
      data: skills,
    });

  } catch (err) {
    console.log("GET SKILLS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= DEACTIVATE SKILL ================= */

export const deleteSkill = async (req, res) => {
  try {
    // CHECK WHETHER SKILL IS ASSIGNED
    const assigned = await EmployeeSkill.find({
      skillId: req.params.id,
    });

    if (assigned.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot Deactivate Skill. It is Assigned to Employee/Employees.",
      });
    }

    // SOFT DELETE
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      {
        status: "Inactive",
      },
      {
        new: true,
      }
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill NOT Found",
      });
    }

    res.json({
      success: true,
      message: "Skill Deactivated Successfully",
      data: skill,
    });

  } catch (err) {
    console.log("DELETE SKILL ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= RESTORE SKILL ================= */

export const restoreSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      {
        status: "Active",
      },
      {
        new: true,
      }
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill NOT Found",
      });
    }

    res.json({
      success: true,
      message: "Skill Restored Successfully",
      data: skill,
    });

  } catch (err) {
    console.log("RESTORE SKILL ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};