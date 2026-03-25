import { attendanceApi } from '@/api/platform.api';

export async function downloadEmployeeReportAttachment(
    reportId: number,
    attachmentIndex: number,
    fileName: string,
    companyContextId?: number,
): Promise<void> {
    const response = await attendanceApi.downloadReportAttachment(reportId, attachmentIndex, companyContextId);
    const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], {
            type: response.headers['content-type'] ?? 'application/octet-stream',
        });

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
}
