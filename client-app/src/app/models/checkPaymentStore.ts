import { Profile } from "./profile";

export interface CheckPaymentData {
    id: string;
    paymentNumber: number;
    date: Date;
    title: string;
    firstName: string;
    lastName: string;
    address: string;
    country: string;
    total: number;
    zipCode: number;
    checkAttendees: Profile[];
}

export class CheckPayment {
    id!: string;
    paymentNumber!: number;
    date!: Date;
    title!: string;
    firstName!: string;
    lastName!: string;
    address!: string;
    country!: string;
    total!: number;
    zipCode!: number;
    isHost!: boolean;
    hostUsername!: string;
    checkAttendees!: Profile[];

    constructor(init?: CheckPaymentFormValues) {
        Object.assign(this, init);
    }
}

export class CheckPaymentFormValues {
    id: string | undefined = undefined;
    paymentNumber!: number;
    date: Date | null = null;
    title: string = "";
    firstName: string = "";
    lastName: string = "";
    address: string = "";
    country: string = "";
    zipCode!: number;
    total!: number;
    checkAttendees: Profile[] = [];

    constructor(checkPayment?: CheckPaymentFormValues) {
        if (checkPayment) {
            this.id = checkPayment.id;
            this.paymentNumber = checkPayment.paymentNumber;
            this.date = checkPayment.date;
            this.title = checkPayment.title;
            this.firstName = checkPayment.firstName;
            this.lastName = checkPayment.lastName;
            this.address = checkPayment.address;
            this.country = checkPayment.country;
            this.zipCode = checkPayment.zipCode;
            this.total = checkPayment.total;
        }
    }
}
