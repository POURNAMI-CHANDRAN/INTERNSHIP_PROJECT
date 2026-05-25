import Skill from "../models/Skill.js";
import EmployeeSkill from "../models/EmployeeSkill.js";

/* =========================================================
   CREATE SKILL
========================================================= */

export const createSkill = async (req, res) => {
  try {
    const { name, skill_name, category } = req.body;

    const finalName = (name || skill_name || "").trim();
    const finalCategory = (category || "General").trim();

    /* VALIDATION */

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: "Skill Name is Required",
      });
    }

    /* CHECK EXISTING */

    const existing = await Skill.findOne({
      name: {
        $regex: new RegExp(`^${finalName}$`, "i"),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${finalName} already exists`,
      });
    }

    /* CREATE */

    const skill = await Skill.create({
      name: finalName,
      category: finalCategory,
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Skill Created Successfully",
      data: skill,
    });

  } catch (err) {
    console.log("CREATE SKILL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/* =========================================================
   GET ALL SKILLS
========================================================= */

export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find()
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });

  } catch (err) {
    console.log("GET SKILLS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/* =========================================================
   GET SKILL CATEGORIES
========================================================= */

export const getSkillCategories = async (req, res) => {
  try {

    const categories = await Skill.distinct("category");

    const cleanedCategories = categories
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      success: true,
      count: cleanedCategories.length,
      data: cleanedCategories,
    });

  } catch (err) {
    console.log("GET SKILL CATEGORIES ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/* =========================================================
   DEACTIVATE SKILL
========================================================= */

export const deleteSkill = async (req, res) => {
  try {
    const skillId = req.params.id;

    /* CHECK ASSIGNMENT */

    const assignedCount = await EmployeeSkill.countDocuments({
      skillId,
    });

    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot Deactivate Skill. It is assigned to employees.",
      });
    }

    /* SOFT DELETE */

    const skill = await Skill.findByIdAndUpdate(
      skillId,
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
        message: "Skill Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill Deactivated Successfully",
      data: skill,
    });

  } catch (err) {
    console.log("DELETE SKILL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/* =========================================================
   RESTORE SKILL
========================================================= */

export const restoreSkill = async (req, res) => {
  try {
    const skillId = req.params.id;

    const skill = await Skill.findByIdAndUpdate(
      skillId,
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
        message: "Skill Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill Restored Successfully",
      data: skill,
    });

  } catch (err) {
    console.log("RESTORE SKILL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};