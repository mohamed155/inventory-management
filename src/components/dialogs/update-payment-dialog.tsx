import {zodResolver} from "@hookform/resolvers/zod";
import {Activity, useEffect, useMemo} from "react";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import z from "zod";
import DatePicker from "@/components/date-picker.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import type {PurchasesListResult} from "@/models/purchases-list-result.ts";
import type {SalesListResult} from "@/models/sales-list-result.ts";

type PaymentData = (PurchasesListResult & { type: 'purchase' }) | (SalesListResult & { type: 'sale' });

type UpdatePaymentProps = {
	open: boolean;
	type: 'purchase' | 'sale';
	data?: PaymentData;
	onClose: (data?: { remainingCost: number, payDueDate: Date }) => void
}

function UpdatePaymentDialog(
	{
		open,
		type,
		data,
		onClose
	}: UpdatePaymentProps) {

	const {t} = useTranslation();

	const formSchema = useMemo(
		() =>
			z
				.object({
					remainingCost: z.number().min(1, t('Paid can not be zero or less')),
					payDueDate: z.date(),
				}),
		[t],
	);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			remainingCost: Number(data?.remainingCost),
			payDueDate: data?.payDueDate
		},
	});

	useEffect(() => {
		form.reset({
			remainingCost: Number(data?.remainingCost),
			payDueDate: data?.payDueDate
		})
	}, [form, data]);

	const onSubmit = async () => {
		onClose(form.getValues());
	}

	if (data) {
		const {totalCost, paidAmount, remainingCost} = data;

		return (
			<Dialog open={open} onOpenChange={() => onClose()}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t('Update Payment')}</DialogTitle>
						</DialogHeader>
						<p>{`${type === 'purchase' ? t('Provider') : t('Customer')}: ${data?.type === 'purchase' ? data?.providerName : data?.customerName}`}</p>
						<p>{`${t('Total')}: ${totalCost}`}</p>
						<p>{`${t('Current Paid')}: ${paidAmount}`}</p>
						<p>{`${t('Current Remaining')}: ${remainingCost}`}</p>
						<FieldGroup>
							<Controller
								name="remainingCost"
								control={form.control}
								render={({field, fieldState}) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>{t('Quantity')}</FieldLabel>
										<Input
											{...field}
											onChange={(e) =>
												field.onChange({
													...e,
													target: { ...e.target, value: Number(e.target.value) },
												})
											}
											aria-invalid={fieldState.invalid}
											autoComplete="off"
											type="number"
										/>
										<Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
											<FieldError errors={[fieldState.error]} />
										</Activity>
									</Field>
								)}
							/>
							<Controller
								name="payDueDate"
								control={form.control}
								render={({field, fieldState}) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>{t('Description')}</FieldLabel>
										<DatePicker
											{...field}
											onChange={(date) =>
												field.onChange({target: {value: date}})
											}
										></DatePicker>
									</Field>
								)}
							/>
						</FieldGroup>
						<DialogFooter>
							<Button className='w-full' onClick={form.handleSubmit(onSubmit)}>{t('Update Payment')}</Button>
						</DialogFooter>
					</DialogContent>
				</form>
			</Dialog>
		);
	}
}

export default UpdatePaymentDialog;
