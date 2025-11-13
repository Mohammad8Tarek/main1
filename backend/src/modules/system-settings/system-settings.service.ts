import prisma from '../../database/prisma';

const getSettings = async (): Promise<{ [key: string]: string }> => {
    const variables = await prisma.systemVariable.findMany();
    return variables.reduce((acc, cur) => {
        acc[cur.key] = cur.value;
        return acc;
    }, {} as { [key: string]: string });
};

const updateSettings = async (settings: { [key: string]: string }): Promise<void> => {
    const updates = Object.entries(settings).map(([key, value]) => 
        prisma.systemVariable.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        })
    );
    await prisma.$transaction(updates);
};

export const systemSettingsService = {
    getSettings,
    updateSettings,
};
