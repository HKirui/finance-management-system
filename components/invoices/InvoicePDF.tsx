
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import path from "node:path";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: path.join(
        process.cwd(),
        "public",
        "fonts",
        "Inter-Regular.ttf"
      ),
      fontWeight: "normal",
    },
    {
      src: path.join(
        process.cwd(),
        "public",
        "fonts",
        "Inter-Bold.ttf"
      ),
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 76,
    paddingHorizontal: 40,
    paddingBottom: 75,
    fontSize: 10,
    fontFamily: "Inter",
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1d4ed8",
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  tagline: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 5,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 5,
  },
  detailsSection: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 30,
  marginBottom: 25,
},
detailsColumn: {
  width: "48%",
},
detailsColumnRight: {
  width: "48%",
  alignItems: "flex-end",
},
sectionLabel: {
  fontSize: 9,
  fontWeight: "bold",
  color: "#6b7280",
  marginBottom: 8,
  textTransform: "uppercase",
},
detailText: {
  fontSize: 11,
  marginBottom: 5,
},
statusText: {
  fontSize: 10,
  fontWeight: "bold",
  color: "#1d4ed8",
  marginTop: 5,
},
table: {
  marginTop: 10,
},
tableHeader: {
  flexDirection: "row",
  backgroundColor: "#eff6ff",
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#bfdbfe",
},
tableRow: {
  flexDirection: "row",
  paddingVertical: 6,
  paddingHorizontal: 8,
  borderBottomWidth: 0.5,
  borderBottomColor: "#e5e7eb",
},
descriptionColumn: {
  width: "43%",
},
quantityColumn: {
  width: "12%",
  textAlign: "center",
},
priceColumn: {
  width: "22%",
  textAlign: "right",
},
totalColumn: {
  width: "23%",
  textAlign: "right",
},
tableHeaderText: {
  fontSize: 9,
  fontWeight: "bold",
  color: "#1e40af",
},
tableCellText: {
  fontSize: 9,
  color: "#374151",
},
summaryContainer: {
  flexDirection: "row",
  justifyContent: "flex-end",
  marginTop: 18,
},

summary: {
  width: "34%",
},

summaryRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 4,
},

summaryLabel: {
  fontSize: 9,
  color: "#64748b",
},

summaryValue: {
  fontSize: 9,
  color: "#1e293b",
  textAlign: "right",
  minWidth: 85,
},

summaryTotal: {
  borderTopWidth: 0.7,
  borderTopColor: "#cbd5e1",
  marginTop: 5,
  paddingTop: 8,
},

balanceRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#eff6ff",
  paddingVertical: 9,
  paddingHorizontal: 6,
  marginTop: 8,
  borderRadius: 3,
},

balanceText: {
  fontSize: 10,
  fontWeight: "bold",
  color: "#1d4ed8",
},
footer: {
  position: "absolute",
  bottom: 25,
  left: 40,
  right: 40,
  alignItems: "center",
},

footerAccent: {
  width: 65,
  height: 4,
  backgroundColor: "#1d4ed8",
  borderRadius: 10,
  marginBottom: 8,
},

footerCompany: {
  fontSize: 11,
  fontWeight: "bold",
  color: "#1d4ed8",
  marginBottom: 6,
},

footerDetails: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

footerDetailText: {
  fontSize: 8,
  color: "#6b7280",
},

footerDot: {
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: "#1d4ed8",
  marginHorizontal: 8,
},
paymentSection: {
  marginTop: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
  backgroundColor: "#ffffff",
  borderWidth: 0.7,
  borderColor: "#cbd5e1",
  borderRadius: 3,
},

paymentTitle: {
  fontSize: 9,
  fontWeight: "bold",
  color: "#1d4ed8",
  marginBottom: 7,
},

paymentMethod: {
  fontSize: 8,
  color: "#64748b",
  marginBottom: 8,
},

paymentRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: 8,
  marginBottom: 7,
  borderBottomWidth: 0.5,
  borderBottomColor: "#e2e8f0",
},

paymentColumn: {
  width: "48%",
},

paymentLabel: {
  fontSize: 7,
  color: "#64748b",
  marginBottom: 4,
},

paymentTill: {
  fontSize: 13,
  fontWeight: "bold",
  color: "#1d4ed8",
},

paymentRecipient: {
  fontSize: 9,
  fontWeight: "bold",
  color: "#1e293b",
},

paymentText: {
  fontSize: 7,
  color: "#64748b",
  marginBottom: 3,
},
continuationHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#dbeafe",
},

continuationCompany: {
  fontSize: 11,
  fontWeight: "bold",
  color: "#1d4ed8",
},

continuationInvoice: {
  fontSize: 9,
  color: "#6b7280",
},
continuationTableHeader: {
  flexDirection: "row",
  backgroundColor: "#eff6ff",
  paddingVertical: 8,
  paddingHorizontal: 8,
  marginTop: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#bfdbfe",
},
detailTextRight: {
  fontSize: 11,
  marginBottom: 5,
  textAlign: "right",
},
});

type InvoicePDFProps = {
  invoiceNumber: string;
  status: string;
  clientName: string;
  clientCompany?: string|null;
  issueDate: string;
  dueDate?: string|null;
  items: {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
   }[];
  subtotal: string;
  taxAmount: string;
  total: string;
  totalPaid: string;
  balanceDue: string;
};

export default function InvoicePDF({
  invoiceNumber,
  status,
  clientName,
  clientCompany,
  issueDate,
  dueDate,
  items,
  subtotal,
  taxAmount,
  total,
  totalPaid,
  balanceDue,
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View
  fixed
  style={{
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
  }}
  render={({ pageNumber }) =>
    pageNumber > 1 ? (
      <View>
        <View style={styles.continuationHeader}>
          <Text style={styles.continuationCompany}>
            K-LINK SOLUTIONS
          </Text>

          <Text style={styles.continuationInvoice}>
            {invoiceNumber}
          </Text>
        </View>

        <View style={styles.continuationTableHeader}>
          <Text
            style={[
              styles.descriptionColumn,
              styles.tableHeaderText,
            ]}
          >
            Service / Product
          </Text>

          <Text
            style={[
              styles.quantityColumn,
              styles.tableHeaderText,
            ]}
          >
            Qty
          </Text>

          <Text
            style={[
              styles.priceColumn,
              styles.tableHeaderText,
            ]}
          >
            Unit Price
          </Text>

          <Text
            style={[
              styles.totalColumn,
              styles.tableHeaderText,
            ]}
          >
            Amount
          </Text>
        </View>
      </View>
    ) : null
  }
/>

        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>
              K-LINK SOLUTIONS
            </Text>
            <Text style={styles.tagline}>
              We Fix, Protect &amp; Automate — Zero Downtime.
            </Text>
          </View>

          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              {invoiceNumber}
            </Text>
          </View>
        </View>
        <View style={styles.detailsSection}>
  <View style={styles.detailsColumn}>
    <Text style={styles.sectionLabel}>Bill To</Text>

    <Text style={styles.detailText}>
      {clientName}
    </Text>

    {clientCompany && (
      <Text style={styles.detailText}>
        {clientCompany}
      </Text>
    )}
  </View>

  <View style={styles.detailsColumnRight}>
    <Text style={styles.sectionLabel}>
      Invoice Details
    </Text>

    <Text style={styles.detailTextRight}>
      Issue Date: {issueDate}
    </Text>

    <Text style={styles.detailTextRight}>
      Due Date: {dueDate || "Not specified"}
    </Text>

    <Text style={styles.statusText}>
      Status: {status.replaceAll("_", " ")}
    </Text>
  </View>
</View>

<View style={styles.table}>
  <View style={styles.tableHeader} wrap={false}>
    <Text style={[styles.descriptionColumn, styles.tableHeaderText]}>
      Service / Product
    </Text>
    <Text style={[styles.quantityColumn, styles.tableHeaderText]}>
      Qty
    </Text>
    <Text style={[styles.priceColumn, styles.tableHeaderText]}>
      Unit Price
    </Text>
    <Text style={[styles.totalColumn, styles.tableHeaderText]}>
      Amount
    </Text>
  </View>

  {items.map((item) => (
    <View key={item.id} style={styles.tableRow} wrap={false}>
      <Text style={[styles.descriptionColumn, styles.tableCellText]}>
        {item.description}
      </Text>

      <Text style={[styles.quantityColumn, styles.tableCellText]}>
        {item.quantity}
      </Text>

      <Text style={[styles.priceColumn, styles.tableCellText]}>
        {item.unitPrice}
      </Text>

      <Text style={[styles.totalColumn, styles.tableCellText]}>
        {item.lineTotal}
      </Text>
    </View>
  ))}
</View>

<View style={styles.summaryContainer} wrap={false}>
  <View style={styles.summary}>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Subtotal</Text>
      <Text style={styles.summaryValue}>{subtotal}</Text>
    </View>

    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Tax</Text>
      <Text style={styles.summaryValue}>{taxAmount}</Text>
    </View>

    <View style={[styles.summaryRow, styles.summaryTotal]}>
      <Text style={styles.summaryValue}>Invoice Total</Text>
      <Text style={styles.summaryValue}>{total}</Text>
    </View>

    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Amount Paid</Text>
      <Text style={styles.summaryValue}>{totalPaid}</Text>
    </View>

    <View style={styles.balanceRow}>
      <Text style={styles.balanceText}>Balance Due</Text>
      <Text style={styles.balanceText}>{balanceDue}</Text>
    </View>
  </View>
</View>

<View style={styles.paymentSection} wrap={false}>
  <Text style={styles.paymentTitle}>
    PAYMENT DETAILS
  </Text>

  <Text style={styles.paymentMethod}>
    M-Pesa | Buy Goods & Services
  </Text>

  <View style={styles.paymentRow}>
    <View style={styles.paymentColumn}>
      <Text style={styles.paymentLabel}>
        TILL NUMBER
      </Text>

      <Text style={styles.paymentTill}>
        1818979
      </Text>
    </View>

    <View style={styles.paymentColumn}>
      <Text style={styles.paymentLabel}>
        REGISTERED RECIPIENT
      </Text>

      <Text style={styles.paymentRecipient}>
        harold kipkosgey kirui
      </Text>
    </View>
  </View>

  <Text style={styles.paymentText}>
    Confirm the registered recipient before paying.
  </Text>

  <Text style={styles.paymentText}>
    Share your M-Pesa confirmation and quote invoice {invoiceNumber}.
  </Text>
</View>

<View style={styles.footer} fixed>
  <View style={styles.footerAccent} />

  <Text style={styles.footerCompany}>
    K-LINK SOLUTIONS
  </Text>

  <View style={styles.footerDetails}>
    <Text style={styles.footerDetailText}>
      Nairobi, Kenya
    </Text>

    <View style={styles.footerDot} />

    <Text style={styles.footerDetailText}>
      klinksolutions4@gmail.com
    </Text>

    <View style={styles.footerDot} />

    <Text style={styles.footerDetailText}>
      +254 758 395 929
    </Text>
  </View>
</View>
      </Page>
    </Document>
  );
}
