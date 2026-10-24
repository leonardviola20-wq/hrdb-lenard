p="d:/VSCode/hrdb-lenard/components/PhilHealthReportsPage.tsx"
s=open(p).read()
start=s.find("{paymentReport && paymentForm")
end=s.find("{deleteReportTarget &&")
old=s[start:end]
print("len", len(old))
open("d:/VSCode/hrdb-lenard/payment_dialog_old.txt","w").write(old)
