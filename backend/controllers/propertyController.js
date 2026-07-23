import * as PropertyModel from "../models/propertyModel.js";

/*
    Create Property
*/
export const createProperty = async (req, res) => {

    try {

        const hostId = req.user.id;

        const {
            title,
            description,
            location,
            property_type,
            price,
            amenities,
            image_urls
        } = req.body;

        const propertyData = {
            host_id: hostId,
            title,
            description,
            location,
            property_type,
            price,
            amenities,
            image_urls
        };

        const { data, error } = await PropertyModel.createProperty(propertyData);

        if (error) {
            return res.status(400).json(error);
        }

        res.status(201).json({
            message: "Property created successfully.",
            property: data
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};


/*
    Get All Properties
*/
export const getAllProperties = async (req, res) => {

    const { data, error } = await PropertyModel.getAllProperties();

    if (error) {
        return res.status(400).json(error);
    }

    res.json(data);

};


/*
    Get Property By ID
*/
export const getPropertyById = async (req, res) => {

    const { id } = req.params;

    const { data, error } = await PropertyModel.getPropertyById(id);

    if (error) {
        return res.status(404).json({
            message: "Property not found."
        });
    }

    res.json(data);

};


/*
    Get Logged-in Host Properties
*/
export const getHostProperties = async (req, res) => {

    const hostId = req.user.id;

    const { data, error } = await PropertyModel.getHostProperties(hostId);

    if (error) {
        return res.status(400).json(error);
    }

    res.json(data);

};


/*
    Update Property
*/
export const updateProperty = async (req, res) => {

    const hostId = req.user.id;

    const { id } = req.params;

    const { data, error } =
        await PropertyModel.updateProperty(id, hostId, req.body);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({
        message: "Property updated successfully.",
        property: data
    });

};


/*
    Delete Property
*/
export const deleteProperty = async (req, res) => {

    const hostId = req.user.id;

    const { id } = req.params;

    const { data, error } =
        await PropertyModel.deleteProperty(id, hostId);

    if (error) {
        return res.status(400).json(error);
    }

    res.json({
        message: "Property deleted successfully.",
        property: data
    });

};