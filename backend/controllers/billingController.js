import Billing from "../models/Billing.js";
import Allocation from "../models/Allocation.js";

/* =========================================================
   ✅ GENERATE BILLING FOR ALL MONTHS (OPTIMIZED)
========================================================= */
export const generateBilling = async (req, res) => {
  try {
    /* -----------------------------------------------------
       🧠 STEP 1: GET UNIQUE MONTHS FROM DB (NOT MEMORY)
    ----------------------------------------------------- */
    const uniqueMonths = await Allocation.aggregate([
      { $match: { isBillable: true } },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
        },
      },
    ]);

    if (!uniqueMonths.length) {
      return res.json({ message: "No Billable Allocations" });
    }

    const results = [];

    /* -----------------------------------------------------
       🧠 STEP 2: PROCESS EACH MONTH
    ----------------------------------------------------- */
    for (const { month, year } of uniqueMonths) {

      const allocations = await Allocation.find({
        month,
        year,
        isBillable: true,
      })
        .populate("employeeId projectId")
        .lean(); // ⚡ faster

      const billingMap = new Map();

      /* -----------------------------------------------------
         🧠 GROUPING
      ----------------------------------------------------- */
      for (const a of allocations) {
        if (!a.employeeId || !a.projectId) continue;

        const key = `${a.employeeId._id}_${a.projectId._id}`;

        if (!billingMap.has(key)) {
          billingMap.set(key, {
            employee_id: a.employeeId._id,
            project_id: a.projectId._id,
            total_hours: 0,
            costPerMonth: Number(a.employeeId?.costPerMonth || 0),
          });
        }

        const bill = billingMap.get(key);
        bill.total_hours += Number(a.allocatedHours || 0);
      }

      /* -----------------------------------------------------
         💾 BULK WRITE (VERY IMPORTANT 🔥)
      ----------------------------------------------------- */
      const bulkOps = [];

      for (const b of billingMap.values()) {
        const rate =
          b.costPerMonth > 0 ? b.costPerMonth / 160 : 500;

        const totalRevenue = b.total_hours * rate;

        bulkOps.push({
          updateOne: {
            filter: {
              employee_id: b.employee_id,
              project_id: b.project_id,
              month,
              year,
            },
            update: {
              $set: {
                employee_id: b.employee_id,
                project_id: b.project_id,
                month,
                year,
                total_hours: b.total_hours,
                rate_per_hour: rate,
                total_revenue: totalRevenue,
              },
            },
            upsert: true,
          },
        });
      }

      if (bulkOps.length) {
        await Billing.bulkWrite(bulkOps); // 🚀 FAST
      }

      results.push({
        month,
        year,
        records: bulkOps.length,
      });
    }

    /* -----------------------------------------------------
       📊 FINAL RESPONSE
    ----------------------------------------------------- */
    const allBilling = await Billing.find().lean();

    const totalRevenue = allBilling.reduce(
      (s, r) => s + (r.total_revenue || 0),
      0
    );

    const totalHours = allBilling.reduce(
      (s, r) => s + (r.total_hours || 0),
      0
    );

    res.json({
      success: true,
      message: "Billing Generated for ALL Months 🚀",
      monthsProcessed: results.length,
      summary: {
        totalRecords: allBilling.length,
        totalRevenue,
        totalHours,
        avgRate: totalHours ? totalRevenue / totalHours : 0,
      },
      monthlyBreakdown: results,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   ✅ GET BILLING
========================================================= */
export const getBilling = async (req, res) => {
  try {
    const data = await Billing.find()
      .populate("employee_id", "name employeeId")
      .populate("project_id", "name");

    res.json({
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

