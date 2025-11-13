
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { buildingService, floorService } from './building.service';
import ApiResponse from '../../utils/apiResponse';

// Building Controller
const createBuilding = asyncHandler(async (req: Request, res: Response) => {
    const building = await buildingService.createBuilding(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, building, 'Building created successfully'));
});

const getAllBuildings = asyncHandler(async (req: Request, res: Response) => {
    const buildings = await buildingService.getAllBuildings();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, buildings));
});

const getBuildingById = asyncHandler(async (req: Request, res: Response) => {
    const building = await buildingService.getBuildingById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, building));
});

const updateBuilding = asyncHandler(async (req: Request, res: Response) => {
    const building = await buildingService.updateBuilding(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, building, 'Building updated successfully'));
});

const deleteBuilding = asyncHandler(async (req: Request, res: Response) => {
    await buildingService.deleteBuilding(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Building deleted successfully'));
});

export const buildingController = {
    createBuilding,
    getAllBuildings,
    getBuildingById,
    updateBuilding,
    deleteBuilding,
};

// Floor Controller
const createFloor = asyncHandler(async (req: Request, res: Response) => {
    const floor = await floorService.createFloor({ ...req.body, buildingId: req.params.id });
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, floor, 'Floor created successfully'));
});

const getFloorsByBuilding = asyncHandler(async (req: Request, res: Response) => {
    const floors = await floorService.getFloorsByBuilding(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, floors));
});

const getFloorById = asyncHandler(async (req: Request, res: Response) => {
    const floor = await floorService.getFloorById(req.params.floorId);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, floor));
});

const updateFloor = asyncHandler(async (req: Request, res: Response) => {
    const floor = await floorService.updateFloor(req.params.floorId, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, floor, 'Floor updated successfully'));
});

const deleteFloor = asyncHandler(async (req: Request, res: Response) => {
    await floorService.deleteFloor(req.params.floorId);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Floor deleted successfully'));
});

export const floorController = {
    createFloor,
    getFloorsByBuilding,
    getFloorById,
    updateFloor,
    deleteFloor,
};
