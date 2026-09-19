"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const admins = await prisma.adminUser.findMany({
        select: { id: true, username: true, email: true, role: true },
    });
    console.log('Admin users:', admins);
}
main()
    .catch((e) => {
    console.error(e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=verify-admin.js.map