import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { EmployeeZodValidation } from "./employee.validation";

const route = Router();
route.get("/", EmployeeController.getAllEmployees);
route.post("/login", EmployeeController.loginEmployee);
route.get("/:id", EmployeeController.getEmployeeById);
route.post(
  "/:id",
  validateRequest(EmployeeZodValidation.createNewEmployeeSchema),
  EmployeeController.createNewEmployee,
);
route.delete("/:id", EmployeeController.deleteEmployee);
export const employeeRouter = route;
