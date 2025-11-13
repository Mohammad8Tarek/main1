import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    rowsPerPage: number;
    onRowsPerPageChange: (rows: number) => void;
    filteredRowCount: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    rowsPerPage,
    onRowsPerPageChange,
    filteredRowCount,
}) => {
    const { t } = useLanguage();

    const renderPaginationButtons = () => {
        if (totalPages <= 1) return null;

        const pageNumbers: (number | string)[] = [];
        const maxPagesToShow = 5;
        const half = Math.floor(maxPagesToShow / 2);

        let start = Math.max(currentPage - half, 1);
        let end = Math.min(start + maxPagesToShow - 1, totalPages);

        if (end - start < maxPagesToShow - 1) {
            start = Math.max(end - maxPagesToShow + 1, 1);
        }
        
        if (start > 1) {
            pageNumbers.push(1);
            if (start > 2) {
                pageNumbers.push('...');
            }
        }

        for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }

        return pageNumbers.map((page, index) => (
            <li key={index}>
                {typeof page === 'number' ? (
                    <button
                        onClick={() => onPageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`flex items-center justify-center text-sm py-2 px-3 leading-tight ${currentPage === page ? 'text-primary-600 bg-primary-50 border-primary-300 dark:bg-slate-700 dark:text-white' : 'text-slate-500 bg-white border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'} `}
                    >
                        {page}
                    </button>
                ) : (
                    <span className="flex items-center justify-center text-sm py-2 px-3 leading-tight text-slate-500 bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700">
                        {page}
                    </span>
                )}
            </li>
        ));
    };

    const showingFrom = Math.min((currentPage - 1) * rowsPerPage + 1, filteredRowCount);
    const showingTo = Math.min(currentPage * rowsPerPage, filteredRowCount);

    return (
        <nav className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4" aria-label="Table navigation">
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                {t('pagination.showing')} <span className="font-semibold text-slate-900 dark:text-white">{filteredRowCount > 0 ? showingFrom : 0}-{showingTo}</span> {t('pagination.of')} <span className="font-semibold text-slate-900 dark:text-white">{filteredRowCount}</span>
            </span>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <label className="text-sm font-normal text-slate-500 dark:text-slate-400">{t('pagination.rowsPerPage')}</label>
                <select value={rowsPerPage} onChange={(e) => onRowsPerPageChange(Number(e.target.value))} className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 w-20 dark:bg-slate-700 dark:border-slate-600">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
                <ul className="inline-flex items-stretch -space-x-px">
                    <li>
                        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center justify-center py-2 px-3 ml-0 text-slate-500 bg-white rounded-l-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-50">
                            <span className="sr-only">{t('pagination.previous')}</span>
                            <i className="fa-solid fa-chevron-left w-3 h-3"></i>
                        </button>
                    </li>
                    {renderPaginationButtons()}
                    <li>
                        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center justify-center py-2 px-3 leading-tight text-slate-500 bg-white rounded-r-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-50">
                            <span className="sr-only">{t('pagination.next')}</span>
                            <i className="fa-solid fa-chevron-right w-3 h-3"></i>
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default PaginationControls;
