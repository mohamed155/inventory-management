import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useMemo} from "react";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import z from "zod";
import DatePicker from "@/components/date-picker.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import type {PurchasesListResult} from "@/models/purchases-list-result.ts";
import type {SalesListResult} from "@/models/sales-list-result.ts";

type PaymentData = (PurchasesListResult & { type: 'purchase' }) | (SalesListResult & { type: 'sale' });

type UpdatePaymentProps = {
	open: boolean;
	type: 'purchase' | 'sale';
	data?: PaymentData;
	close: () => void
}

function UpdatePaymentDialog(
	{
		open,
		type,
		data,
		close
	}: UpdatePaymentProps) {

	const {t} = useTranslation();

	const formSchema = useMemo(
		() =>
			z
				.object({
					paid: z.number().min(1, t('Paid can not be zero or less')),
					paymentDueDate: z.date().min(new Date(), t('Payment due date can not be before today')),
				}),
		[t],
	);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			paid: 0,
			paymentDueDate: new Date()
		},
	});

	useEffect(() => {
		form.reset({
			paid: 0,
			paymentDueDate: new Date()
		})
	}, [form]);

	const onSubmit = async () => {

	}

	if (data) {
		const {totalCost, paidAmount, remainingCost} = data;

		return (
			<Dialog open={open} onOpenChange={close}>
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
							name="paid"
							control={form.control}
							render={({field, fieldState}) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('New Paid Amount')}</FieldLabel>
									<Input
										{...field}
										aria-invalid={fieldState.invalid}
										autoComplete="off"
									/>
								</Field>
							)}
						/>
						<Controller
							name="paymentDueDate"
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
			</Dialog>
		);
	}
}

export default UpdatePaymentDialog;
