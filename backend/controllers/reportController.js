import * as ReportModel from "../models/reportModel.js";
import { serviceSupabase } from "../config/supabaseClient.js";


/*
=====================================================
CREATE REPORT
POST /api/reports
=====================================================
*/
export const createReport = async (req, res) => {

    try {

        const reporterId = req.user.id;

        const {
            property_id,
            category,
            description
        } = req.body;


        if (
            !property_id ||
            !category ||
            !description?.trim()
        ) {
            return res.status(400).json({
                message:
                    "property_id, category and description are required."
            });
        }


        const allowedCategories = [
            "fraudulent_listing",
            "inappropriate_content",
            "policy_violation",
            "other"
        ];


        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                message:
                    "Invalid report category."
            });
        }


        /*
            Make sure the property exists.
        */
        const {
            data: property,
            error: propertyError
        } = await req.supabase
            .from("properties")
            .select("id, title")
            .eq("id", property_id)
            .maybeSingle();


        if (propertyError) {
            return res.status(400).json({
                message:
                    propertyError.message
            });
        }


        if (!property) {
            return res.status(404).json({
                message:
                    "Property not found."
            });
        }


        const reportData = {
            reporter_id: reporterId,
            property_id,
            category,
            description:
                description.trim(),
            status: "pending"
        };


        const {
            data,
            error
        } = await ReportModel.createReport(
            reportData,
            req.supabase
        );


        if (error) {
            return res.status(400).json({
                message:
                    error.message
            });
        }


        return res.status(201).json({
            message:
                "Report submitted successfully.",
            report: data
        });


    } catch (error) {

        console.error(
            "Create Report Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to submit report."
        });
    }
};



/*
=====================================================
GET MY REPORTS
GET /api/reports/my-reports
=====================================================
*/
export const getMyReports = async (req, res) => {

    try {

        const reporterId =
            req.user.id;


        const {
            data,
            error
        } = await ReportModel.getMyReports(
            reporterId,
            req.supabase
        );


        if (error) {
            return res.status(400).json({
                message:
                    "Failed to load your reports.",
                error:
                    error.message
            });
        }


        return res.json(
            data || []
        );


    } catch (error) {

        console.error(
            "Get My Reports Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to load your reports."
        });
    }
};



/*
=====================================================
GET ALL REPORTS FOR ADMIN
GET /api/reports/admin/all
=====================================================
*/
export const getAllReportsForAdmin = async (
    req,
    res
) => {

    try {

        if (!serviceSupabase) {
            return res.status(500).json({
                message:
                    "Server admin database client is not configured."
            });
        }


        const {
            data,
            error
        } = await ReportModel.getAllReportsForAdmin(
            serviceSupabase
        );


        if (error) {
            return res.status(400).json({
                message:
                    "Failed to load reports.",
                error:
                    error.message
            });
        }


        return res.json(
            data || []
        );


    } catch (error) {

        console.error(
            "Get All Reports Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to load reports."
        });
    }
};



/*
=====================================================
UPDATE REPORT STATUS / ADMIN NOTE
PUT /api/reports/admin/:id
=====================================================
*/
export const updateReportByAdmin = async (
    req,
    res
) => {

    try {

        if (!serviceSupabase) {
            return res.status(500).json({
                message:
                    "Server admin database client is not configured."
            });
        }


        const { id } =
            req.params;

        const {
            status,
            admin_note
        } = req.body;


        const allowedStatuses = [
            "pending",
            "reviewed",
            "resolved",
            "rejected"
        ];


        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message:
                    "Invalid report status."
            });
        }


        const {
            data,
            error
        } = await ReportModel.updateReportByAdmin(
            id,
            {
                status,
                admin_note:
                    admin_note?.trim() || null
            },
            serviceSupabase
        );


        if (error) {
            return res.status(400).json({
                message:
                    "Could not update report.",
                error:
                    error.message
            });
        }


        return res.json({
            message:
                "Report updated successfully.",
            report: data
        });


    } catch (error) {

        console.error(
            "Update Report Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update report."
        });
    }
};