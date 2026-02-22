import {useTranslation} from 'react-i18next';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog.tsx';
import type {Purchase, Sale} from '../../../generated/prisma/browser.ts';
import {Badge} from "@/components/ui/badge.tsx";
import {Table, TableBody, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";

function InvoiceDialog(
	{
		open,
		type,
		data,
		close
	}: {
		open: boolean;
		type: 'purchase' | 'sale';
		data: Purchase | Sale;
		close: () => void
	}) {
	const {t} = useTranslation();

	return (
		<Dialog open={open} onOpenChange={close}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{type === 'purchase' ? t('Purchase Details') : t('Sale Details')}
					</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<h6>{t('Provider')}</h6>
						<p>{t('Provider 1')}</p>
					</div>
					<div>
						<h6>{t('Date')}</h6>
						<p>{t('Date 1')}</p>
					</div>
					<div>
						<h6>{t('Payment Due')}</h6>
						<p>{t('Total 1')}</p>
					</div>
					<div>
						<h6>{t('Status')}</h6>
						<Badge>{t('Status 1')}</Badge>
					</div>
				</div>
				<div>
					<h6>{t('Products')}</h6>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t('Product')}
								</TableHead>
								<TableHead>
									{t('Quantity')}
								</TableHead>
								<TableHead>
									{t('Unit Price')}
								</TableHead>
								<TableHead>
									{t('Total')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableHead>
									{t('Product 1')}
								</TableHead>
								<TableHead>
									{t('Quantity 1')}
								</TableHead>
								<TableHead>
									{t('Unit Price 1')}
								</TableHead>
								<TableHead>
									{t('Total 1')}
								</TableHead>
							</TableRow>
						</TableBody>
					</Table>
				</div>
				<div className="flex justify-between items-center">
					<h6>{t('Total Amount:')}</h6>
					<p>{t('Total 1')}</p>
				</div>
				<div className="flex justify-between items-center">
					<h6>{t('Paid Amount:')}</h6>
					<p className="text-green-600">{t('Paid 1')}</p>
				</div>
				<div className="flex justify-between items-center">
					<h6>{t('Remaining Amount:')}</h6>
					<p className="text-red-600">{t('Balance 1')}</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default InvoiceDialog;
