
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MaintenanceRequest, Room, MAINTENANCE_PROBLEM_TYPES } from '../types';
import { maintenanceApi, roomApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useExportSettings } from '../context/ExportSettingsContext';
import { exportToPdf, exportToExcel } from '../services/exportService';
import ExportOptionsModal from '../components/ExportOptionsModal';
import PaginationControls from '../components/PaginationControls';
import { useSystemSettings } from '../App';
import { GoogleGenAI } from '@google/genai';


type StatusFilter = 'all' | MaintenanceRequest['status'];
type SortConfig = {
    key: keyof MaintenanceRequest | null;
    direction: 'ascending' | 'descending';
};


const MaintenancePage: React.FC = () => {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const { showToast } = useToast();
    const canManage = user?.roles?.some(r => ['super_admin', 'admin', 'supervisor', 'maintenance'].includes(r));
    const { settings: exportSettings } = useExportSettings();
    const { ai_suggestions } = useSystemSettings();


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
    const [formData, setFormData] = useState({
        roomId: '', problemType: '', description: '', status: 'open' as MaintenanceRequest['status'], dueDate: ''
    });
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'reportedAt', direction: 'descending' });
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const isDescriptionUserModified = useRef(false);


    // Export states
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [isExcelExporting, setIsExcelExporting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [requestsData, roomsData] = await Promise.all([ maintenanceApi.getAll(), roomApi.getAll() ]);
            setRequests(requestsData);
            setRooms(roomsData);
        } catch (error) {
            console.error("Failed to fetch maintenance data", error);
            showToast(t('errors.fetchFailed'), 'error');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const roomMap = useMemo(() => new Map(rooms.map(r => [r.id, r.roomNumber])), [rooms]);

    const sortedAndFilteredRequests = useMemo(() => {
        let sortableItems = [...requests];
        
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof MaintenanceRequest];
                const bValue = b[sortConfig.key as keyof MaintenanceRequest];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                const aDate = new Date(aValue as string).getTime();
                const bDate = new Date(bValue as string).getTime();

                if (aDate < bDate) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aDate > bDate) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        if (statusFilter === 'all') return sortableItems;
        return sortableItems.filter(r => r.status === statusFilter);
    }, [requests, statusFilter, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, sortConfig]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedAndFilteredRequests.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedAndFilteredRequests, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedAndFilteredRequests.length / rowsPerPage);
    
    const openAddModal = () => {
        setEditingRequest(null);
        setFormData({ roomId: '', problemType: MAINTENANCE_PROBLEM_TYPES[0], description: '', status: 'open', dueDate: '' });
        isDescriptionUserModified.current = false;
        setIsModalOpen(true);
    };

    const isAddingNew = !editingRequest;
    useEffect(() => {
        if (isModalOpen && isAddingNew && ai_suggestions && formData.problemType) {
            const getAiSuggestion = async () => {
                setIsAiLoading(true);
                try {
                    if (!process.env.API_KEY) {
                        showToast(t('errors.apiKeyMissing'), 'error');
                        console.error("Gemini API key is missing. Please set the API_KEY environment variable.");
                        return;
                    }
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const translatedProblemType = t(`maintenance.problemTypes.${formData.problemType}`);
                    const prompt = `Generate a very brief, professional description for a housing maintenance request about "${translatedProblemType}". The description should be a few words, suitable for a form field. Do not use markdown or special formatting.`;
    
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    
                    const suggestion = response.text.trim();
                    if (!isDescriptionUserModified.current) {
                        setFormData(prev => ({ ...prev, description: suggestion }));
                    }
                } catch (err) {
                    console.error("AI suggestion failed:", err);
                    showToast(t('errors.generic'), 'error');
                } finally {
                    setIsAiLoading(false);
                }
            };
            
            getAiSuggestion();
        }
    }, [formData.problemType, isModalOpen, isAddingNew, ai_suggestions, t]);


    const openEditModal = (request: MaintenanceRequest) => {
        setEditingRequest(request);
        const dueDateForInput = request.dueDate ? request.dueDate.split('T')[0] : '';
        
        const isStandardType = (MAINTENANCE_PROBLEM_TYPES as readonly string[]).includes(request.problemType);
        
        let problemType = request.problemType;
        let description = request.description;
        
        if (!isStandardType && request.problemType) {
            problemType = 'other';
            description = `[Original: ${request.problemType}] ${request.description}`;
        }

        setFormData({ 
            ...request, 
            roomId: String(request.roomId), 
            problemType: problemType,
            description: description,
            dueDate: dueDateForInput 
        });
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'description') {
            isDescriptionUserModified.current = true;
        }
        if (name === 'problemType') {
            isDescriptionUserModified.current = false;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const dueDateISO = formData.dueDate ? new Date(formData.dueDate).toISOString() : null;
        const submissionData = { ...formData, roomId: formData.roomId, dueDate: dueDateISO };
        try {
            if (editingRequest) {
                await maintenanceApi.update(editingRequest.id, submissionData);
                showToast(t('maintenance.updated'), 'success');
            } else {
                await maintenanceApi.create({ ...submissionData, reportedAt: new Date().toISOString() });
                showToast(t('maintenance.added'), 'success');
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error("Failed to save request", error);
            showToast(t('errors.generic'), 'error');
        } finally { setIsSubmitting(false); }
    };

    const handleStatusChange = async (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => {
        setUpdatingRequestId(request.id);
        try {
            await maintenanceApi.update(request.id, { status: newStatus });
            showToast(t('maintenance.statusUpdated'), 'success');
            await fetchData(); // Refresh page data
        } catch (error) {
            showToast(t('errors.generic'), 'error');
        } finally {
            setUpdatingRequestId(null);
        }
    };

    const handleDelete = async (request: MaintenanceRequest) => {
        if (!window.confirm(t('maintenance.deleteConfirm'))) return;
        try {
            await maintenanceApi.delete(request.id);
            showToast(t('maintenance.deleted'), 'success');
            await fetchData();
        } catch (error) {
            console.error("Failed to delete request", error);
            showToast(t('errors.generic'), 'error');
        }
    };
    
    const getStatusBadge = (status: MaintenanceRequest['status']) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const requestSort = (key: keyof MaintenanceRequest) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey: keyof MaintenanceRequest) => {
        if (sortConfig.key !== columnKey) {
            return <i className="fa-solid fa-sort text-slate-400 ml-2"></i>;
        }
        if (sortConfig.direction === 'ascending') {
            return <i className="fa-solid fa-sort-up text-primary-600 ml-2"></i>;
        }
        return <i className="fa-solid fa-sort-down text-primary-600 ml-2"></i>;
    };
    
    const handlePdfExport = async () => {
        setIsPdfExporting(true);
        showToast(t('exporting'), 'info');
        try {
            const headers = [t('maintenance.room'), t('maintenance.problemType'), t('maintenance.description'), t('maintenance.status'), t('maintenance.reported'), t('maintenance.dueDate')];
            const data = sortedAndFilteredRequests.map(req => [
                roomMap.get(req.roomId) || t('unknown'),
                t(`maintenance.problemTypes.${req.problemType}`) || req.problemType,
                req.description,
                t(`statuses.${req.status.replace('_', '')}`),
                new Date(req.reportedAt).toLocaleString(),
                req.dueDate ? new Date(req.dueDate).toLocaleDateString() : '—'
            ]);
            const filename = `report_maintenance_${new Date().toISOString().split('T')[0]}.pdf`;
            exportToPdf({ headers, data, title: t('maintenance.reportTitle'), filename, settings: exportSettings, language });
        } catch(error) {
            console.error("PDF Export failed:", error);
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsPdfExporting(false);
            setIsExportModalOpen(false);
        }
    };

    const handleExcelExport = async () => {
        setIsExcelExporting(true);
        showToast(t('exporting'), 'info');
        try {
            const headers = [t('maintenance.room'), t('maintenance.problemType'), t('maintenance.description'), t('maintenance.status'), t('maintenance.reported'), t('maintenance.dueDate')];
            const data = sortedAndFilteredRequests.map(req => [
                roomMap.get(req.roomId) || t('unknown'),
                t(`maintenance.problemTypes.${req.problemType}`) || req.problemType,
                req.description,
                t(`statuses.${req.status.replace('_', '')}`),
                new Date(req.reportedAt).toLocaleString(),
                req.dueDate ? new Date(req.dueDate).toLocaleDateString() : '—'
            ]);
            const filename = `report_maintenance_${new Date().toISOString().split('T')[0]}.xlsx`;
            exportToExcel({ headers, data, filename, settings: exportSettings });
        } catch(error) {
            console.error("Excel Export failed:", error);
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsExcelExporting(false);
            setIsExportModalOpen(false);
        }
    };
    
    const formInputClass = "w-full p-2 border border-slate-300 rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-slate-200";
    const isExporting = isPdfExporting || isExcelExporting;

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('maintenance.title')}</h1>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                     <div className="p-4 flex flex-col sm:flex-row justify-between items-center border-b dark:border-slate-700 gap-4">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {(['all', 'open', 'in_progress', 'resolved'] as StatusFilter[]).map(status => (
                                <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm rounded-full ${statusFilter === status ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t(`statuses.${status.replace('_', '')}`)}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsExportModalOpen(true)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm disabled:opacity-50" disabled={isExporting}>
                                {isExporting ? <><i className="fa-solid fa-spinner fa-spin me-2"></i>{t('exporting')}</> : <><i className="fa-solid fa-download me-2"></i>{t('export')}</>}
                            </button>
                            {canManage && <button onClick={openAddModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 w-full sm:w-auto"><i className="fa-solid fa-plus me-2"></i>{t('maintenance.newRequest')}</button>}
                        </div>
                    </div>
                    {loading ? (<div className="p-6 text-center">{t('loading')}...</div>) : (
                        <>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">{t('maintenance.room')}</th>
                                        <th scope="col" className="px-6 py-3">{t('maintenance.problem')}</th>
                                        <th scope="col" className="px-6 py-3">
                                            <button onClick={() => requestSort('reportedAt')} className="flex items-center font-semibold uppercase text-xs">
                                                {t('maintenance.reported')}
                                                {getSortIcon('reportedAt')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            <button onClick={() => requestSort('dueDate')} className="flex items-center font-semibold uppercase text-xs">
                                                {t('maintenance.dueDate')}
                                                {getSortIcon('dueDate')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-3">{t('maintenance.status')}</th>
                                        {canManage && <th scope="col" className="px-6 py-3">{t('actions')}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRequests.map(req => {
                                        const isOverdue = req.dueDate && new Date(req.dueDate) < new Date() && req.status !== 'resolved';
                                        return (
                                            <tr key={req.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">{roomMap.get(req.roomId) || t('unknown')}</th>
                                                <td className="px-6 py-4">{t(`maintenance.problemTypes.${req.problemType}`) || req.problemType}</td>
                                                <td className="px-6 py-4">{new Date(req.reportedAt).toLocaleString()}</td>
                                                <td className={`px-6 py-4 ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                                                    {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(req.status)}`}>{t(`statuses.${req.status.replace('_', '')}`)}</span></td>
                                                {canManage && (
                                                    <td className="px-6 py-4 space-x-2 rtl:space-x-reverse whitespace-nowrap">
                                                        {req.status === 'open' && (
                                                            <button onClick={() => handleStatusChange(req, 'in_progress')} disabled={updatingRequestId === req.id} className="font-medium text-yellow-600 dark:text-yellow-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {updatingRequestId === req.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('maintenance.start')}
                                                            </button>
                                                        )}
                                                        {req.status === 'in_progress' && (
                                                            <button onClick={() => handleStatusChange(req, 'resolved')} disabled={updatingRequestId === req.id} className="font-medium text-green-600 dark:text-green-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {updatingRequestId === req.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('maintenance.resolve')}
                                                            </button>
                                                        )}
                                                        <button onClick={() => openEditModal(req)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">{t('edit')}</button>
                                                        <button onClick={() => handleDelete(req)} className="font-medium text-red-600 dark:text-red-500 hover:underline">{t('delete')}</button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                            filteredRowCount={sortedAndFilteredRequests.length}
                        />
                        </>
                    )}
                </div>
            </div>

            {isModalOpen && canManage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{editingRequest ? t('maintenance.editRequest') : t('maintenance.newRequest')}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('maintenance.room')}</label><select name="roomId" value={formData.roomId} onChange={handleFormChange} required className={formInputClass}><option value="" disabled>-- {t('select')} --</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}</select></div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('maintenance.problemType')}</label>
                                    <select name="problemType" value={formData.problemType} onChange={handleFormChange} required className={formInputClass}>
                                        {MAINTENANCE_PROBLEM_TYPES.map(type => (
                                            <option key={type} value={type}>{t(`maintenance.problemTypes.${type}`)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('maintenance.dueDate')}</label>
                                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleFormChange} className={formInputClass}/>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('maintenance.description')}</label>
                                <div className="relative">
                                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} className={`${formInputClass} pr-8`}></textarea>
                                    {isAiLoading && (
                                        <div className="absolute top-2 right-2 rtl:left-2 rtl:right-auto">
                                            <i className="fa-solid fa-spinner fa-spin text-primary-500"></i>
                                        </div>
                                    )}
                                    {ai_suggestions && !isAiLoading && isAddingNew && (
                                        <div className="absolute top-2 right-2 rtl:left-2 rtl:right-auto text-primary-500" title="AI Suggestions Enabled">
                                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editingRequest && <div className="mb-6"><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('maintenance.status')}</label><select name="status" value={formData.status} onChange={handleFormChange} className={formInputClass}><option value="open">{t('statuses.open')}</option><option value="in_progress">{t('statuses.inprogress')}</option><option value="resolved">{t('statuses.resolved')}</option></select></div>}
                            <div className="flex justify-end gap-4 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 rounded">{t('cancel')}</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded disabled:bg-primary-400">{isSubmitting ? `${t('saving')}...` : t('save')}</button></div>
                        </form>
                    </div>
                </div>
            )}

            <ExportOptionsModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExportPdf={handlePdfExport}
                onExportExcel={handleExcelExport}
                isPdfExporting={isPdfExporting}
                isExcelExporting={isExcelExporting}
            />
        </>
    );
};

export default MaintenancePage;