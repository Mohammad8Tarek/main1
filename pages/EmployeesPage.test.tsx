import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import EmployeesPage from './EmployeesPage';
// FIX: Removed `logActivity` from import as it's no longer used or exported.
import { employeeApi, assignmentApi, roomApi } from '../services/apiService';
import '@testing-library/jest-dom';
import type { Employee } from '../types';
import * as Auth from '../hooks/useAuth';

// Mock the API module and other dependencies
jest.mock('../services/apiService', () => {
    const originalModule = jest.requireActual<typeof import('../services/apiService')>('../services/apiService');
    return {
        ...originalModule,
        employeeApi: {
            getAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        assignmentApi: {
            getAll: jest.fn().mockResolvedValue([]),
        },
        roomApi: {
            getAll: jest.fn().mockResolvedValue([]),
        },
    };
});

const mockedEmployeeApi = {
    getAll: employeeApi.getAll as jest.Mock<typeof employeeApi.getAll>,
    create: employeeApi.create as jest.Mock<typeof employeeApi.create>,
    update: employeeApi.update as jest.Mock<typeof employeeApi.update>,
    delete: employeeApi.delete as jest.Mock<typeof employeeApi.delete>,
};

// Mock useAuth to provide an admin user
const mockUseAuth = jest.spyOn(Auth, 'useAuth');

const mockEmployees: Employee[] = [
    { id: '1', employeeId: 'EMP001', firstName: 'John', lastName: 'Doe', nationalId: '123456789', jobTitle: 'Developer', phone: '111', department: 'it', status: 'active', contractEndDate: '2025-01-01T00:00:00.000Z' },
    { id: '2', employeeId: 'EMP002', firstName: 'Jane', lastName: 'Smith', nationalId: '987654321', jobTitle: 'HR Manager', phone: '222', department: 'hr', status: 'active', contractEndDate: '2025-01-01T00:00:00.000Z' },
    { id: '3', employeeId: 'EMP003', firstName: 'Peter', lastName: 'Jones', nationalId: '112233445', jobTitle: 'Designer', phone: '333', department: 'marketing', status: 'left', contractEndDate: '2023-01-01T00:00:00.000Z' },
];

describe('EmployeesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedEmployeeApi.getAll.mockResolvedValue([...mockEmployees]);
        mockUseAuth.mockReturnValue({
            user: { id: 'test-admin-id', username: 'testadmin', roles: ['admin'], status: 'active' },
            loading: false,
            login: jest.fn(),
            logout: jest.fn(),
            token: 'fake-token'
        });
    });

    afterEach(() => {
        mockUseAuth.mockRestore();
    });

    it('renders the page, add button, and displays employees', async () => {
        render(<EmployeesPage />);
        expect(screen.getByRole('heading', { name: /employee management/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByText('Jane')).toBeInTheDocument();
            expect(screen.getByText('Peter')).toBeInTheDocument();
        });
    });

    it('filters employees by search term', async () => {
        render(<EmployeesPage />);
        await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());
        
        const searchInput = screen.getByPlaceholderText(/search by name or national id.../i);
        fireEvent.change(searchInput, { target: { value: 'Jane' } });

        expect(screen.queryByText('John')).not.toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.queryByText('Peter')).not.toBeInTheDocument();
    });

    it('filters employees by status', async () => {
        render(<EmployeesPage />);
        await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

        const statusFilter = screen.getByLabelText(/status/i);
        fireEvent.change(statusFilter, { target: { value: 'left' } });

        expect(screen.queryByText('John')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane')).not.toBeInTheDocument();
        expect(screen.getByText('Peter')).toBeInTheDocument();
    });

    it('opens add modal, creates a new employee, and displays it', async () => {
        const newEmployee: Employee = { id: '4', employeeId: 'EMP004', firstName: 'Test', lastName: 'User', nationalId: '444555666', jobTitle: 'QA', phone: '444', department: 'it', status: 'active', contractEndDate: '2026-01-01T00:00:00.000Z' };
        mockedEmployeeApi.create.mockResolvedValue(newEmployee);
        
        const originalGetAll = mockedEmployeeApi.getAll.getMockImplementation();
        mockedEmployeeApi.getAll.mockImplementation(async () => {
             // Simulate the refetch after creation
            if (mockedEmployeeApi.create.mock.calls.length > 0) {
                 return [...mockEmployees, newEmployee];
            }
            return mockEmployees;
        });
        
        render(<EmployeesPage />);
        
        fireEvent.click(screen.getByRole('button', { name: /add employee/i }));

        // Wait for modal to appear
        await screen.findByRole('heading', { name: /add employee/i });
        
        // Fill out the form
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/employee id/i), { target: { value: 'EMP004' } });
        fireEvent.change(screen.getByLabelText(/national id/i), { target: { value: '444555666' } });
        fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '444' } });
        fireEvent.change(screen.getByLabelText(/contract end date/i), { target: { value: '2026-01-01' } });
        
        const departmentSelect = screen.getByLabelText(/department/i);
        fireEvent.change(departmentSelect, { target: { value: 'it' } });
        
        // Wait for job titles to update based on department selection
        await waitFor(() => {
            const jobTitleSelect = screen.getByLabelText(/job title/i);
            expect(jobTitleSelect.children.length).toBeGreaterThan(0);
        });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        // Check if the API was called
        await waitFor(() => {
            expect(mockedEmployeeApi.create).toHaveBeenCalledWith(expect.objectContaining({
                firstName: 'Test',
                lastName: 'User',
                employeeId: 'EMP004'
            }));
        });

        // Check if the new employee is displayed in the table
        await waitFor(() => {
            expect(screen.getByText('Test')).toBeInTheDocument();
            expect(screen.getByText('User')).toBeInTheDocument();
        });
        
        // Restore original mock
        mockedEmployeeApi.getAll.mockImplementation(originalGetAll);
    });
});