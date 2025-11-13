
import prisma from '../../database/prisma';
import { Prisma, Building, Floor } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

// Building Service
const createBuilding = async (buildingData: Prisma.BuildingCreateInput): Promise<Building> => {
    const building = await prisma.building.create({ data: buildingData });
    logger.info(`Created building: ${building.name}`);
    return building;
};

const getAllBuildings = async (): Promise<Building[]> => {
    return prisma.building.findMany({ include: { floors: { include: { _count: { select: { rooms: true } } } } } });
};

const getBuildingById = async (id: string): Promise<Building> => {
    const building = await prisma.building.findUnique({
        where: { id },
        include: { floors: { include: { rooms: true } } }
    });
    if (!building) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Building not found');
    }
    return building;
};

const updateBuilding = async (id: string, updateData: Prisma.BuildingUpdateInput): Promise<Building> => {
    await getBuildingById(id);
    const updatedBuilding = await prisma.building.update({ where: { id }, data: updateData });
    logger.info(`Updated building: ${updatedBuilding.name}`);
    return updatedBuilding;
};

const deleteBuilding = async (id: string): Promise<void> => {
    const building = await getBuildingById(id);
    const floorIds = building.floors.map(f => f.id);
    const roomsCount = await prisma.room.count({ where: { floorId: { in: floorIds } } });
    if (roomsCount > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete building with rooms. Please delete rooms first.');
    }
    await prisma.floor.deleteMany({ where: { buildingId: id } });
    await prisma.building.delete({ where: { id } });
    logger.info(`Deleted building: ${building.name}`);
};

export const buildingService = {
    createBuilding,
    getAllBuildings,
    getBuildingById,
    updateBuilding,
    deleteBuilding,
};

// Floor Service
const createFloor = async (floorData: Prisma.FloorUncheckedCreateInput): Promise<Floor> => {
    await getBuildingById(floorData.buildingId);
    const floor = await prisma.floor.create({ data: floorData });
    logger.info(`Created floor ${floor.floorNumber} in building ID: ${floor.buildingId}`);
    return floor;
};

const getFloorsByBuilding = async (buildingId: string): Promise<Floor[]> => {
    return prisma.floor.findMany({ where: { buildingId } });
};

const getFloorById = async (id: string): Promise<Floor> => {
    const floor = await prisma.floor.findUnique({ where: { id } });
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Floor not found');
    }
    return floor;
};

const updateFloor = async (id: string, updateData: Prisma.FloorUpdateInput): Promise<Floor> => {
    await getFloorById(id);
    const updatedFloor = await prisma.floor.update({ where: { id }, data: updateData });
    logger.info(`Updated floor ${updatedFloor.floorNumber} (ID: ${id})`);
    return updatedFloor;
};

const deleteFloor = async (id: string): Promise<void> => {
    const floor = await getFloorById(id);
    const roomsCount = await prisma.room.count({ where: { floorId: id } });
    if (roomsCount > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete floor with rooms.');
    }
    await prisma.floor.delete({ where: { id } });
    logger.info(`Deleted floor ${floor.floorNumber} (ID: ${id})`);
};

export const floorService = {
    createFloor,
    getFloorsByBuilding,
    getFloorById,
    updateFloor,
    deleteFloor,
};
