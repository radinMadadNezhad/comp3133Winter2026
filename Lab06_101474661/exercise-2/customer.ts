class Customer {

    firstName: string;
    lastName: string;

    greeter() {
        console.log(`Hello ${this.firstName} ${this.lastName}`);
    }
}

let customer = new Customer();

customer.firstName = "Radin";
customer.lastName = "Madad Nezhad Aligorkeh";

customer.greeter();